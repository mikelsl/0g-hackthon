import { Markup, Telegraf } from 'telegraf';
import type { Context } from 'telegraf';
import { copyFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { WerewolfEngine } from '../engine/WerewolfEngine.js';
import { QueuedHumanActionProvider } from '../engine/QueuedHumanActionProvider.js';
import { createComputeAdapter } from '../compute/createComputeAdapter.js';
import { createStorageAdapter } from '../storage/createStorageAdapter.js';
import type { StorageAdapter } from '../storage/StorageAdapter.js';
import type { GameRegistryAdapter } from '../chain/GameRegistryAdapter.js';
import { createGameRegistryAdapter } from '../chain/createGameRegistryAdapter.js';
import { persistGameArtifacts } from '../pipeline/persistGameArtifacts.js';
import { writeLocalShadowArtifact } from '../pipeline/writeLocalShadowArtifacts.js';
import { updateGameIndex } from '../web/gameIndex.js';
import type { GameEvent, GameState, Player } from '../types/game.js';
import { shuffle } from '../utils/random.js';

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

  stop(reason = 'shutdown'): void {
    this.bot.stop(reason);
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

    const abortHandler = async (ctx: Context) => {
      const room = this.requireRoom(ctx);
      if (!room) return;
      room.humans.abortAll?.('Game aborted by user command');
      room.running = false;
      this.rooms.delete(this.chatKey(ctx));
      await ctx.reply(`Game ${room.gameId} aborted. Use /newgame to start fresh.`);
    };

    this.bot.command('abortgame', abortHandler);
    this.bot.command('endgame', abortHandler);

    this.bot.command('startgame', async (ctx) => {
      const room = this.requireRoom(ctx);
      if (!room) return;
      if (room.running) return ctx.reply('Game already running.');
      if (room.players.length < 1) return ctx.reply('At least one human should /join before starting.');

      const players = shuffle([...room.players, ...DEFAULT_AGENT_PLAYERS].slice(0, 6));
      const compute = createComputeAdapter();
      const engine = new WerewolfEngine(compute, room.humans);
      const storage = createStorageAdapter();
      const chain = createGameRegistryAdapter();
      room.running = true;
      room.state = engine.createGame(room.gameId, players);

      await this.replyHtml(ctx, [
        `🎮 <b>Game started</b>` ,
        `<code>${this.escapeHtml(room.gameId)}</code>`,
        '',
        `🎲 <b>Seat order this game</b>`,
        this.formatPublicPlayerList(players),
        '',
        `🔒 <b>Private role messages have been sent.</b>`,
        `🌙 Night phase will begin immediately.`
      ].join('\n'));
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
      if (!text) return this.replyHtml(ctx, 'Usage: <code>/say your public speech</code>');
      const ok = room.humans.submitSpeech(`u${from.id}`, `${from.first_name ?? from.username}: ${text}`);
      await this.replyHtml(ctx, ok ? '✅ <b>Speech submitted.</b>\nWaiting for the rest of the table...' : 'No pending speech request for you.');
    });

    this.bot.command('vote', async (ctx) => {
      const room = this.requireRoom(ctx);
      if (!room) return;
      const from = ctx.from;
      if (!from) return;
      const target = this.commandPayload(ctx).trim();
      if (!target) return this.replyHtml(ctx, 'Usage: <code>/vote &lt;playerId&gt;</code>');
      const ok = room.humans.submitVote(`u${from.id}`, target);
      await this.replyHtml(ctx, ok ? `✅ <b>Vote submitted</b>\nTarget: <b>${this.escapeHtml(this.playerName(room, target))}</b>` : 'No pending vote request for you.');
    });

    this.bot.command('kill', async (ctx) => {
      const room = this.requireRoom(ctx);
      if (!room) return;
      const from = ctx.from;
      if (!from) return;
      const target = this.commandPayload(ctx).trim();
      if (!target) return this.replyHtml(ctx, 'Usage: <code>/kill &lt;playerId&gt;</code>');
      const ok = room.humans.submitNightKill(`u${from.id}`, target);
      await this.replyHtml(ctx, ok ? `✅ <b>Night kill submitted</b>\nTarget: <b>${this.escapeHtml(this.playerName(room, target))}</b>` : 'No pending night kill request for you.');
    });

    this.bot.command('check', async (ctx) => {
      const room = this.requireRoom(ctx);
      if (!room) return;
      const from = ctx.from;
      if (!from) return;
      const target = this.commandPayload(ctx).trim();
      if (!target) return this.replyHtml(ctx, 'Usage: <code>/check &lt;playerId&gt;</code>');
      const ok = room.humans.submitSeerCheck(`u${from.id}`, target);
      await this.replyHtml(ctx, ok ? `✅ <b>Seer check submitted</b>\nTarget: <b>${this.escapeHtml(this.playerName(room, target))}</b>` : 'No pending seer check request for you.');
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
      await ctx.answerCbQuery(ok ? `${action} submitted: ${this.playerName(room, targetId)}` : `No pending ${action} request for you.`);
      if (ok) {
        await ctx.editMessageReplyMarkup(undefined).catch(() => undefined);
        await this.replyHtml(ctx, `✅ <b>${this.escapeHtml(action)} submitted</b>\nTarget: <b>${this.escapeHtml(this.playerName(room, targetId))}</b>`);
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

    let announcedEvents = 0;
    const flushPublicEvents = async () => {
      if (!room.state) return;
      const nextEvents = room.state.events.slice(announcedEvents);
      announcedEvents = room.state.events.length;
      for (const event of nextEvents) {
        if (event.publicText) {
          await this.replyHtml(ctx, this.formatPublicEvent(room, event)).catch(() => undefined);
        } else if (event.type === 'seer_check' && event.actorId && event.privateNote) {
          await this.notifyHuman(
            ctx,
            event.actorId,
            `🔮 <b>Seer result</b>\n${this.escapeHtml(event.privateNote)}`,
            undefined,
            true
          ).catch(() => undefined);
        }
      }
    };

    const reminderMs = Number(process.env.HUMAN_PENDING_REMINDER_MS ?? 60000);
    const notifier = setInterval(() => {
      const pending = room.humans.listPending();
      for (const req of pending) {
        const secondsLeft = Math.max(0, Math.ceil((req.timeoutAt - Date.now()) / 1000));
        const suffix = `\n\n⏳ Timeout fallback in ~<b>${secondsLeft}s</b>.`;
        const alivePlayers = room.state?.players.filter((p) => p.alive) ?? [];
        const alive = this.formatPublicPlayerList(alivePlayers);
        const nonWolves = this.formatPublicPlayerList(room.state?.players.filter((p) => p.alive && p.role !== 'wolf') ?? []);
        const voteTargets = req.allowedTargetIds?.length
          ? this.formatPublicPlayerList(room.state?.players.filter((p) => req.allowedTargetIds?.includes(p.id)) ?? [])
          : alive;
        const msg = req.type === 'speech'
          ? `🗣 <b>${this.escapeHtml(req.playerName)}</b>\n\nIt is your turn to speak.\nUse <code>/say &lt;message&gt;</code>.${suffix}`
          : req.type === 'vote'
            ? `🗳 <b>${this.escapeHtml(req.playerName)}</b>\n\nVote now.\nTap a button or use <code>/vote &lt;playerId&gt;</code>.\n\n<b>Legal vote targets</b>\n${voteTargets}${suffix}`
            : req.type === 'nightKill'
              ? `🐺 <b>${this.escapeHtml(req.playerName)}</b> · 🐺 <b>Wolf</b>\n\nNight action: choose a kill target.\nTap a button or use <code>/kill &lt;playerId&gt;</code>.\n\n<b>Legal targets</b>\n${nonWolves}${suffix}`
              : `🔮 <b>${this.escapeHtml(req.playerName)}</b> · 🔮 <b>Seer</b>\n\nNight action: inspect one player.\nTap a button or use <code>/check &lt;playerId&gt;</code>.\n\n<b>Alive players</b>\n${alive}${suffix}`;
        void this.notifyHuman(ctx, req.playerId, msg, this.keyboardForRequest(room, req.type, req.playerId, req.allowedTargetIds), req.type === 'nightKill' || req.type === 'seerCheck').catch(() => undefined);
      }
    }, reminderMs);

    const broadcaster = setInterval(() => {
      void flushPublicEvents();
    }, 1000);

    try {
      const { state, summary } = await engine.runToEnd(room.state, Number(process.env.DEMO_MAX_ROUNDS ?? 3));
      await flushPublicEvents();
      await writeLocalShadowArtifact(`${room.gameId}/transcript.json`, state.events);
      await writeLocalShadowArtifact(`${room.gameId}/summary.raw.json`, summary);
      if (summary.agentMemories) await writeLocalShadowArtifact('latest-agent-memories.json', summary.agentMemories);
      const rawTranscriptArtifact = await storage.putJson(`${room.gameId}/transcript.json`, state.events);
      const rawSummaryArtifact = await storage.putJson(`${room.gameId}/summary.raw.json`, summary);
      const chainRecord = await chain.finalizeGame(state, summary, rawTranscriptArtifact.root, rawSummaryArtifact.root);
      // Chain finalization uses the same wallet as Storage in 0G demos. Recreate the
      // storage adapter after chain txs so the next Storage batch starts from the
      // fresh pending nonce instead of the pre-chain local nonce cursor.
      const postChainStorage = createStorageAdapter();
      const persisted = await persistGameArtifacts(postChainStorage, state, summary, chainRecord, {
        manifestPath: `artifacts/${room.gameId}/replay-manifest.json`,
        latestManifestPath: process.env.TELEGRAM_UPDATE_LATEST_REPLAY === '1' ? 'web/data/latest-demo.json' : undefined,
        engine: this.engineLabel(),
        rawTranscriptArtifact,
        rawSummaryArtifact
      });
      await this.publishToWeb(room.gameId, summary.winner, state.events.length, chainRecord.registryAddress);
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
      clearInterval(broadcaster);
      room.running = false;
    }
  }

  private async publishToWeb(gameId: string, winner: string, eventCount: number, registryAddress?: string): Promise<void> {
    const webRoot = process.env.PUBLIC_WEB_ROOT?.trim();
    if (!webRoot) return;

    const sourceManifest = `artifacts/${gameId}/replay-manifest.json`;
    const targetManifest = join(webRoot, 'artifacts', gameId, 'replay-manifest.json');
    await mkdir(dirname(targetManifest), { recursive: true });
    await copyFile(sourceManifest, targetManifest);
    await updateGameIndex(join(webRoot, 'data', 'game-index.json'), {
      gameId,
      winner,
      eventCount,
      generatedAt: new Date().toISOString(),
      networkLabel: process.env.CHAIN_BACKEND === '0g' ? '0G Galileo Testnet' : 'Local Dev',
      storageMode: process.env.STORAGE_BACKEND === '0g' ? '0G Storage turbo' : 'Local JSON artifacts',
      manifestPath: `artifacts/${gameId}/replay-manifest.json`,
      registry: registryAddress || 'Mock registry'
    });
    await copyFile(sourceManifest, join(webRoot, 'data', 'latest-demo.json'));
  }

  private async sendPrivateRoleNotices(room: RoomSession): Promise<void> {
    if (!room.state) return;
    const playersLine = this.formatPublicPlayerList(room.state.players);
    const wolves = room.state.players.filter((p) => p.role === 'wolf');

    for (const player of room.state.players.filter((p) => p.kind === 'human')) {
      const role = player.role ?? 'unknown';
      let text = [
        `🎮 <b>Game</b> <code>${this.escapeHtml(room.gameId)}</code>`,
        '',
        `🔒 <b>Your private role</b>` ,
        `${this.roleEmoji(role)} <b>${this.escapeHtml(this.roleLabel(role))}</b>`,
        '',
        `🎲 <b>Seat order</b>`,
        playersLine
      ].join('\n');

      if (role === 'wolf') {
        const teammates = wolves.filter((p) => p.id !== player.id);
        text += teammates.length > 0
          ? `\n\n🐺 <b>Your wolf teammate(s)</b>\n${this.formatPublicPlayerList(teammates)}\n\nAt night, use <code>/kill &lt;playerId&gt;</code> when prompted.`
          : `\n\n🐺 You are the <b>only wolf</b> alive.\nAt night, use <code>/kill &lt;playerId&gt;</code> when prompted.`;
      } else if (role === 'seer') {
        text += `\n\n🔮 You are the <b>seer</b>.\nAt night, use <code>/check &lt;playerId&gt;</code> when prompted.`;
      } else if (role === 'villager') {
        text += `\n\n🧑‍🌾 You are a <b>villager</b>.\nSurvive, track contradictions, and vote carefully during the day.`;
      }

      text += `\n\n⚠️ Do not reveal this message unless strategically useful.`;
      const chatId = this.userChats.get(player.id);
      if (chatId) {
        await this.bot.telegram.sendMessage(chatId, text, { parse_mode: 'HTML' }).catch(() => undefined);
      }
    }
  }

  private async notifyHuman(
    ctx: Context,
    playerId: string,
    message: string,
    keyboard?: ReturnType<typeof Markup.inlineKeyboard>,
    privateOnly = false
  ): Promise<void> {
    const chatId = this.userChats.get(playerId);
    const extra = { parse_mode: 'HTML' as const, ...(keyboard ?? {}) };
    if (chatId) {
      await this.bot.telegram.sendMessage(chatId, message, extra);
      return;
    }
    if (privateOnly) {
      await this.replyHtml(ctx, '🔒 A private night action is waiting for a player. Please DM <code>/start</code> to the bot to receive secret role prompts.');
      return;
    }
    await this.replyHtml(ctx, `${message}
Tip: DM <code>/start</code> to this bot to receive private role/action prompts.`, keyboard);
  }

  private keyboardForRequest(
    room: RoomSession,
    type: 'speech' | 'vote' | 'nightKill' | 'seerCheck',
    playerId: string,
    allowedTargetIds?: string[]
  ): ReturnType<typeof Markup.inlineKeyboard> | undefined {
    if (!room.state || type === 'speech') return undefined;
    const action = type === 'nightKill' ? 'kill' : type === 'seerCheck' ? 'check' : 'vote';
    const candidates = room.state.players.filter((p) => {
      if (!p.alive) return false;
      if (type === 'nightKill') return p.role !== 'wolf';
      if (type === 'vote' && allowedTargetIds?.length) return allowedTargetIds.includes(p.id);
      return p.id !== playerId;
    });
    const buttons = candidates.map((p) => Markup.button.callback(`${p.displayName} (${p.id})`, `mg:${action}:${p.id}`));
    const rows = [];
    for (let i = 0; i < buttons.length; i += 2) rows.push(buttons.slice(i, i + 2));
    return Markup.inlineKeyboard(rows);
  }

  private async replyHtml(ctx: Context, html: string, keyboard?: ReturnType<typeof Markup.inlineKeyboard>): Promise<void> {
    await ctx.reply(html, { parse_mode: 'HTML', ...(keyboard ?? {}) });
  }

  private formatPublicEvent(room: RoomSession, event: GameEvent): string {
    const actor = event.actorId ? room.state?.players.find((p) => p.id === event.actorId) : undefined;
    const target = event.targetId ? room.state?.players.find((p) => p.id === event.targetId) : undefined;
    const text = this.formatText(event.publicText ?? '');

    if (event.type === 'phase_started') return `<b>${text}</b>`;
    if (event.type === 'speech' && actor) {
      const body = this.formatText(this.stripSpeakerPrefix(event.publicText ?? '', actor.displayName));
      return `🗣 <b>${this.escapeHtml(actor.displayName)}</b> ${this.kindEmoji(actor)} <b>${this.kindLabel(actor)}</b>\n\n${body}`;
    }
    if (event.type === 'vote' && actor) {
      return `🗳 <b>Vote</b>\n${this.playerChip(actor)}\n→ ${target ? this.playerChip(target) : `<b>${this.escapeHtml(event.targetId ?? 'unknown')}</b>`}`;
    }
    if (event.type === 'night_kill' && target) return `☠️ <b>Dawn death</b>\n${this.playerChip(target)} was found dead.`;
    if (event.type === 'eliminated') return `⚖️ <b>Eliminated</b>\n${target ? this.playerChip(target) : '<b>A player</b>'} was eliminated.`;
    if (event.type === 'game_finished') return `🏁 <b>${text}</b>`;
    if (event.type === 'vote_tie' || event.type === 'vote_no_elimination') return `<b>${text}</b>`;
    return text;
  }

  private stripSpeakerPrefix(text: string, displayName: string): string {
    return text.replace(new RegExp(`^${displayName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*[:：-]\\s*`, 'i'), '').trim();
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  private formatText(value: string): string {
    return this.escapeHtml(this.wrapByPunctuation(value));
  }

  private wrapByPunctuation(value: string): string {
    const normalized = value.replace(/\s+/g, ' ').trim();
    if (normalized.length <= 80) return normalized;
    return normalized
      .replace(/([。！？!?；;])\s*/g, '$1\n')
      .replace(/([，,])\s*/g, '$1 ')
      .split('\n')
      .flatMap((line) => this.softWrapLine(line, 72))
      .join('\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  private softWrapLine(line: string, maxLen: number): string[] {
    if (line.length <= maxLen) return [line];
    const parts: string[] = [];
    let rest = line.trim();
    while (rest.length > maxLen) {
      const punctuationCut = Math.max(rest.lastIndexOf(',', maxLen), rest.lastIndexOf('，', maxLen));
      const spaceCut = rest.lastIndexOf(' ', maxLen);
      const cut = punctuationCut > maxLen * 0.45 ? punctuationCut + 1 : spaceCut > maxLen * 0.45 ? spaceCut : maxLen;
      parts.push(rest.slice(0, cut).trim());
      rest = rest.slice(cut).trim();
    }
    if (rest) parts.push(rest);
    return parts;
  }

  private formatPublicPlayerList(players: Array<Pick<Player, 'id' | 'displayName' | 'kind'>>): string {
    return players.map((p, i) => `${i + 1}. ${this.playerChip(p)}`).join('\n');
  }

  private playerChip(player: Pick<Player, 'id' | 'displayName' | 'kind'>): string {
    return `${this.kindEmoji(player)} <b>${this.escapeHtml(player.displayName)}</b> <code>${this.escapeHtml(player.id)}</code> · <b>${this.kindLabel(player)}</b>`;
  }

  private playerName(room: RoomSession, playerId: string): string {
    return room.state?.players.find((p) => p.id === playerId)?.displayName ?? playerId;
  }

  private kindEmoji(player: Pick<Player, 'kind'>): string {
    return player.kind === 'human' ? '👤' : '🤖';
  }

  private kindLabel(player: Pick<Player, 'kind'>): string {
    return player.kind === 'human' ? 'Human' : 'AI Agent';
  }

  private roleEmoji(role?: string): string {
    if (role === 'wolf') return '🐺';
    if (role === 'seer') return '🔮';
    if (role === 'villager') return '🧑‍🌾';
    return '🎭';
  }

  private roleLabel(role?: string): string {
    if (role === 'wolf') return 'Wolf';
    if (role === 'seer') return 'Seer';
    if (role === 'villager') return 'Villager';
    return role ?? 'Unknown';
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
      '/abortgame - force end the current game',
      '',
      'Quick start: /newgame -> /join -> /startgame',
      'Env: COMPUTE_BACKEND=0g-speech uses 0G Router Qwen speech + mock decisions; USE_LLM=1 enables full LLM agents.'
    ].join('\n');
  }

  private engineLabel(): string {
    const backend = (process.env.COMPUTE_BACKEND ?? '').trim().toLowerCase();
    if (backend.startsWith('0g')) return 'Telegram + 0G Compute Router speech + mock decisions';
    if (backend === 'llm-speech') return 'Telegram + LLM speech + mock decisions';
    if (backend === 'llm' || process.env.USE_LLM === '1') return 'Telegram + LLM agents';
    return 'Telegram + mock agents';
  }
}
