import { Markup, Telegraf } from 'telegraf';
import type { Context } from 'telegraf';
import { WerewolfEngine } from '../engine/WerewolfEngine.js';
import { QueuedHumanActionProvider } from '../engine/QueuedHumanActionProvider.js';
import { LlmComputeAdapter } from '../compute/LlmComputeAdapter.js';
import { MockComputeAdapter } from '../compute/MockComputeAdapter.js';
import { createStorageAdapter } from '../storage/createStorageAdapter.js';
import type { StorageAdapter } from '../storage/StorageAdapter.js';
import type { GameRegistryAdapter } from '../chain/GameRegistryAdapter.js';
import { createGameRegistryAdapter } from '../chain/createGameRegistryAdapter.js';
import { persistGameArtifacts } from '../pipeline/persistGameArtifacts.js';
import { writeLocalShadowArtifact } from '../pipeline/writeLocalShadowArtifacts.js';
import type { GameState, Player } from '../types/game.js';

interface RoomSession {
  chatId: number | string;
  gameId: string;
  players: Array<Omit<Player, 'role' | 'alive'>>;
  state?: GameState;
  humans: QueuedHumanActionProvider;
  running: boolean;
}

const DEFAULT_AGENT_PLAYERS: Array<Omit<Player, 'role' | 'alive'>> = [
  { id: 'a1', displayName: 'Ada', kind: 'agent', agentPersonaId: 'analyst' },
  { id: 'a2', displayName: 'Charm', kind: 'agent', agentPersonaId: 'charmer' },
  { id: 'a3', displayName: 'Riot', kind: 'agent', agentPersonaId: 'chaos-wolf' },
  { id: 'a4', displayName: 'Shade', kind: 'agent', agentPersonaId: 'silent-killer' },
  { id: 'a5', displayName: 'Mira', kind: 'agent', agentPersonaId: 'empath' }
];

export class TelegramWerewolfBot {
  private readonly bot: Telegraf;
  private readonly rooms = new Map<string, RoomSession>();
  private readonly userChats = new Map<string, number>();

  constructor(token: string) {
    this.bot = new Telegraf(token);
    this.registerHandlers();
  }

  async launch(): Promise<void> {
    await this.bot.launch();
    console.log('0G MindGames Telegram bot launched.');
  }

  private registerHandlers(): void {
    this.bot.use(async (ctx, next) => {
      if (ctx.from && ctx.chat?.type === 'private') {
        this.userChats.set(`u${ctx.from.id}`, ctx.chat.id);
      }
      return next();
    });

    this.bot.start(async (ctx) => {
      await ctx.reply(this.helpText());
    });

    this.bot.command('help', async (ctx) => ctx.reply(this.helpText()));

    this.bot.command('newgame', async (ctx) => {
      const chatId = this.chatKey(ctx);
      const gameId = `tg-${Date.now()}`;
      this.rooms.set(chatId, {
        chatId: ctx.chat?.id ?? chatId,
        gameId,
        players: [],
        humans: new QueuedHumanActionProvider(),
        running: false
      });
      await ctx.reply(`Created game ${gameId}. Use /join to join. Need 1 human + 5 AI for MVP, or more humans up to 6 total.`);
    });

    this.bot.command('join', async (ctx) => {
      const room = this.requireRoom(ctx);
      if (!room) return;
      if (room.running) return ctx.reply('Game already running.');
      const from = ctx.from;
      if (!from) return ctx.reply('Cannot identify user.');
      const id = `u${from.id}`;
      if (room.players.some((p) => p.id === id)) return ctx.reply('You already joined.');
      if (room.players.length >= 6) return ctx.reply('Room is full.');
      room.players.push({ id, displayName: from.first_name ?? from.username ?? id, kind: 'human' });
      await ctx.reply(`Joined: ${from.first_name ?? from.username ?? id}. Humans: ${room.players.length}. Use /startgame when ready.`);
    });

    this.bot.command('status', async (ctx) => {
      const room = this.requireRoom(ctx);
      if (!room) return;
      const pending = room.humans.listPending();
      await ctx.reply(JSON.stringify({
        gameId: room.gameId,
        running: room.running,
        players: room.state?.players.map((p) => ({ id: p.id, name: p.displayName, alive: p.alive, kind: p.kind })) ?? room.players,
        pending
      }, null, 2));
    });

    this.bot.command('startgame', async (ctx) => {
      const room = this.requireRoom(ctx);
      if (!room) return;
      if (room.running) return ctx.reply('Game already running.');
      if (room.players.length < 1) return ctx.reply('At least one human should /join before starting.');

      const players = [...room.players, ...DEFAULT_AGENT_PLAYERS].slice(0, 6);
      const compute = process.env.USE_LLM === '1' ? new LlmComputeAdapter() : new MockComputeAdapter();
      const engine = new WerewolfEngine(compute, room.humans);
      const storage = createStorageAdapter();
      const chain = createGameRegistryAdapter();
      room.running = true;
      room.state = engine.createGame(room.gameId, players);

      await ctx.reply(`Game started: ${room.gameId}\nPlayers:\n${players.map((p) => `- ${p.displayName} (${p.kind})`).join('\n')}`);
      await this.sendPrivateRoleNotices(room);
      this.runGame(ctx, room, engine, storage, chain).catch(async (err) => {
        room.running = false;
        console.error(err);
        await ctx.reply(`Game failed: ${err instanceof Error ? err.message : String(err)}`);
      });
    });

    this.bot.command('say', async (ctx) => {
      const room = this.requireRoom(ctx);
      if (!room) return;
      const from = ctx.from;
      if (!from) return;
      const text = this.commandPayload(ctx);
      if (!text) return ctx.reply('Usage: /say your public speech');
      const ok = room.humans.submitSpeech(`u${from.id}`, `${from.first_name ?? from.username}: ${text}`);
      await ctx.reply(ok ? 'Speech submitted.' : 'No pending speech request for you.');
    });

    this.bot.command('vote', async (ctx) => {
      const room = this.requireRoom(ctx);
      if (!room) return;
      const from = ctx.from;
      if (!from) return;
      const target = this.commandPayload(ctx).trim();
      if (!target) return ctx.reply('Usage: /vote <playerId>');
      const ok = room.humans.submitVote(`u${from.id}`, target);
      await ctx.reply(ok ? `Vote submitted: ${target}` : 'No pending vote request for you.');
    });

    this.bot.command('kill', async (ctx) => {
      const room = this.requireRoom(ctx);
      if (!room) return;
      const from = ctx.from;
      if (!from) return;
      const target = this.commandPayload(ctx).trim();
      if (!target) return ctx.reply('Usage: /kill <playerId>');
      const ok = room.humans.submitNightKill(`u${from.id}`, target);
      await ctx.reply(ok ? `Night kill submitted: ${target}` : 'No pending night kill request for you.');
    });

    this.bot.command('check', async (ctx) => {
      const room = this.requireRoom(ctx);
      if (!room) return;
      const from = ctx.from;
      if (!from) return;
      const target = this.commandPayload(ctx).trim();
      if (!target) return ctx.reply('Usage: /check <playerId>');
      const ok = room.humans.submitSeerCheck(`u${from.id}`, target);
      await ctx.reply(ok ? `Seer check submitted: ${target}` : 'No pending seer check request for you.');
    });

    this.bot.action(/^mg:(vote|kill|check):(.+)$/, async (ctx) => {
      const room = this.requireRoom(ctx);
      if (!room) return;
      const from = ctx.from;
      if (!from) return;
      const action = ctx.match[1];
      const targetId = ctx.match[2];
      const playerId = `u${from.id}`;
      const ok = action === 'vote'
        ? room.humans.submitVote(playerId, targetId)
        : action === 'kill'
          ? room.humans.submitNightKill(playerId, targetId)
          : room.humans.submitSeerCheck(playerId, targetId);
      await ctx.answerCbQuery(ok ? `${action} submitted: ${targetId}` : `No pending ${action} request for you.`);
      if (ok) {
        await ctx.editMessageReplyMarkup(undefined).catch(() => undefined);
        await ctx.reply(`${action} submitted: ${targetId}`);
      }
    });
  }

  private async runGame(
    ctx: Context,
    room: RoomSession,
    engine: WerewolfEngine,
    storage: StorageAdapter,
    chain: GameRegistryAdapter
  ): Promise<void> {
    if (!room.state) throw new Error('Room state missing');

    const notifier = setInterval(() => {
      const pending = room.humans.listPending();
      for (const req of pending) {
        const secondsLeft = Math.max(0, Math.ceil((req.timeoutAt - Date.now()) / 1000));
        const suffix = `\nTimeout fallback in ~${secondsLeft}s.`;
        const alive = room.state?.players.filter((p) => p.alive).map((p) => `${p.id}:${p.displayName}`).join(', ') ?? '';
        const nonWolves = room.state?.players.filter((p) => p.alive && p.role !== 'wolf').map((p) => `${p.id}:${p.displayName}`).join(', ') ?? '';
        const msg = req.type === 'speech'
          ? `${req.playerName}, your turn to speak. Use /say <message>.${suffix}`
          : req.type === 'vote'
            ? `${req.playerName}, vote now. Tap a button or use /vote <playerId>. Alive players: ${alive}${suffix}`
            : req.type === 'nightKill'
              ? `${req.playerName}, you are the lead wolf. Tap a button or use /kill <playerId>. Legal targets: ${nonWolves}${suffix}`
              : `${req.playerName}, you are the seer. Tap a button or use /check <playerId>. Alive players: ${alive}${suffix}`;
        void this.notifyHuman(ctx, req.playerId, msg, this.keyboardForRequest(room, req.type, req.playerId)).catch(() => undefined);
      }
    }, 8000);

    try {
      const { state, summary } = await engine.runToEnd(room.state, Number(process.env.DEMO_MAX_ROUNDS ?? 3));
      await writeLocalShadowArtifact(`${room.gameId}/transcript.json`, state.events);
      await writeLocalShadowArtifact(`${room.gameId}/summary.raw.json`, summary);
      const rawTranscriptArtifact = await storage.putJson(`${room.gameId}/transcript.json`, state.events);
      const rawSummaryArtifact = await storage.putJson(`${room.gameId}/summary.raw.json`, summary);
      const chainRecord = await chain.finalizeGame(state, summary, rawTranscriptArtifact.root, rawSummaryArtifact.root);
      const persisted = await persistGameArtifacts(storage, state, summary, chainRecord, {
        manifestPath: `artifacts/${room.gameId}/replay-manifest.json`,
        latestManifestPath: process.env.TELEGRAM_UPDATE_LATEST_REPLAY === '1' ? 'web/data/latest-demo.json' : undefined,
        engine: process.env.USE_LLM === '1' ? 'Telegram + LLM agents' : 'Telegram + mock agents',
        rawTranscriptArtifact,
        rawSummaryArtifact
      });
      await ctx.reply([
        `Game finished: ${room.gameId}`,
        `Winner: ${summary.winner}`,
        `Events: ${state.events.length}`,
        `Public transcript root: ${persisted.publicTranscriptArtifact.root}`,
        `Private audit root: ${persisted.privateAuditTranscriptArtifact.root}`,
        `Summary root: ${persisted.summaryArtifact.root}`,
        `${chainRecord.registryAddress ? 'Registry tx' : 'Mock tx'}: ${chainRecord.txHash}`
      ].join('\n'));
    } finally {
      clearInterval(notifier);
      room.running = false;
    }
  }

  private async sendPrivateRoleNotices(room: RoomSession): Promise<void> {
    if (!room.state) return;
    for (const player of room.state.players.filter((p) => p.kind === 'human')) {
      const role = player.role ?? 'unknown';
      const text = `Your private role in ${room.gameId}: ${role}. Do not reveal it unless strategically useful.`;
      const chatId = this.userChats.get(player.id);
      if (chatId) {
        await this.bot.telegram.sendMessage(chatId, text).catch(() => undefined);
      }
    }
  }

  private async notifyHuman(ctx: Context, playerId: string, message: string, keyboard?: ReturnType<typeof Markup.inlineKeyboard>): Promise<void> {
    const chatId = this.userChats.get(playerId);
    if (chatId) {
      await this.bot.telegram.sendMessage(chatId, message, keyboard);
      return;
    }
    await ctx.reply(`${message}
Tip: DM /start to this bot to receive private role/action prompts.`, keyboard);
  }

  private keyboardForRequest(
    room: RoomSession,
    type: 'speech' | 'vote' | 'nightKill' | 'seerCheck',
    playerId: string
  ): ReturnType<typeof Markup.inlineKeyboard> | undefined {
    if (!room.state || type === 'speech') return undefined;
    const action = type === 'nightKill' ? 'kill' : type === 'seerCheck' ? 'check' : 'vote';
    const candidates = room.state.players.filter((p) => {
      if (!p.alive) return false;
      if (type === 'nightKill') return p.role !== 'wolf';
      return p.id !== playerId;
    });
    const buttons = candidates.map((p) => Markup.button.callback(`${p.displayName} (${p.id})`, `mg:${action}:${p.id}`));
    const rows = [];
    for (let i = 0; i < buttons.length; i += 2) rows.push(buttons.slice(i, i + 2));
    return Markup.inlineKeyboard(rows);
  }

  private requireRoom(ctx: Context): RoomSession | undefined {
    const chatId = this.chatKey(ctx);
    const room = this.rooms.get(chatId);
    if (!room) {
      void ctx.reply('No active room. Use /newgame first.');
      return undefined;
    }
    return room;
  }

  private chatKey(ctx: Context): string {
    return String(ctx.chat?.id ?? 'unknown');
  }

  private commandPayload(ctx: Context): string {
    const message = ctx.message;
    const text = message && 'text' in message && typeof message.text === 'string' ? message.text : '';
    return text.replace(/^\/\w+(@\w+)?\s*/, '');
  }

  private helpText(): string {
    return [
      '0G MindGames Arena — Werewolf MVP',
      '',
      '/newgame - create room',
      '/join - join as human',
      '/startgame - start with humans + AI agents',
      '/say <message> - submit speech when asked',
      '/vote <playerId> - submit vote when asked, or tap button',
      '/kill <playerId> - submit wolf night kill when asked, or tap button',
      '/check <playerId> - submit seer inspection when asked, or tap button',
      '/status - show room status',
      '',
      'Env: USE_LLM=1 enables LLM agents; default uses mock agents.'
    ].join('\n');
  }
}
