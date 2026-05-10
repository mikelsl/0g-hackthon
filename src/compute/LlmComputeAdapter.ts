import type { ComputeAdapter, AgentSpeechResult } from './ComputeAdapter.js';
import type { GameState, Player, Role } from '../types/game.js';
import { getPersona } from '../agents/personas.js';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface LlmConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
  temperature: number;
  maxTokens: number;
}

interface SpeechJson {
  publicText: string;
  privateNote: string;
}

interface ChoiceJson {
  targetId: string;
  privateNote: string;
}

export class LlmComputeAdapter implements ComputeAdapter {
  private readonly config: LlmConfig;

  constructor(config?: Partial<LlmConfig>) {
    this.config = {
      baseUrl: config?.baseUrl ?? process.env.LLM_BASE_URL ?? process.env.OPENAI_BASE_URL ?? 'https://api.openai.com/v1',
      apiKey: config?.apiKey ?? process.env.LLM_API_KEY ?? process.env.OPENAI_API_KEY ?? '',
      model: config?.model ?? process.env.LLM_MODEL ?? process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
      temperature: config?.temperature ?? Number(process.env.LLM_TEMPERATURE ?? 0.8),
      maxTokens: config?.maxTokens ?? Number(process.env.LLM_MAX_TOKENS ?? 500)
    };

    if (!this.config.apiKey) {
      throw new Error('Missing LLM_API_KEY or OPENAI_API_KEY for LlmComputeAdapter');
    }
  }

  async generateSpeech(player: Player, state: GameState): Promise<AgentSpeechResult> {
    const persona = getPersona(player.agentPersonaId ?? 'analyst');
    const schema = '{"publicText":"what this player says publicly, <=80 words","privateNote":"private reasoning, <=80 words"}';
    const content = await this.chatJson<SpeechJson>([
      {
        role: 'system',
        content: [
          'You are an AI player in a Werewolf social deduction game.',
          'You must play to win for your hidden role/camp.',
          'Never reveal your hidden role unless strategically forced.',
          'Return ONLY valid compact JSON. No markdown.',
          `Required JSON schema: ${schema}`
        ].join('\n')
      },
      {
        role: 'user',
        content: JSON.stringify({
          task: 'Generate public speech for the current day phase.',
          player: this.safePlayer(player),
          persona,
          game: this.publicGameView(state),
          privateRole: player.role,
          strategicHint: this.roleHint(player.role)
        })
      }
    ]);

    return {
      publicText: this.cleanText(content.publicText, `${player.displayName}: I need more information before committing.`),
      privateNote: this.cleanText(content.privateNote, 'No private reasoning returned.')
    };
  }

  async chooseVote(player: Player, state: GameState): Promise<string> {
    return this.chooseTarget('Choose one alive player to vote out during the day.', player, state, (p) => p.alive && p.id !== player.id);
  }

  async chooseNightKill(wolf: Player, state: GameState): Promise<string> {
    return this.chooseTarget('You are a wolf. Choose one alive non-wolf player to eliminate at night.', wolf, state, (p) => p.alive && p.role !== 'wolf');
  }

  async chooseSeerCheck(seer: Player, state: GameState): Promise<string> {
    return this.chooseTarget('You are the seer. Choose one alive player to inspect tonight.', seer, state, (p) => p.alive && p.id !== seer.id);
  }

  private async chooseTarget(task: string, player: Player, state: GameState, filter: (p: Player) => boolean): Promise<string> {
    const candidates = state.players.filter(filter);
    if (candidates.length === 0) throw new Error(`No candidates for task: ${task}`);

    const schema = '{"targetId":"one candidate id","privateNote":"short reasoning"}';
    const result = await this.chatJson<ChoiceJson>([
      {
        role: 'system',
        content: [
          'You are an AI player in a Werewolf social deduction game.',
          'You must choose a legal target from the provided candidates only.',
          'Return ONLY valid compact JSON. No markdown.',
          `Required JSON schema: ${schema}`
        ].join('\n')
      },
      {
        role: 'user',
        content: JSON.stringify({
          task,
          player: this.safePlayer(player),
          persona: player.agentPersonaId ? getPersona(player.agentPersonaId) : undefined,
          privateRole: player.role,
          candidates: candidates.map((p) => this.safePlayer(p)),
          game: this.publicGameView(state),
          strategicHint: this.roleHint(player.role)
        })
      }
    ]);

    if (candidates.some((p) => p.id === result.targetId)) return result.targetId;
    return candidates[0].id;
  }

  private async chatJson<T>(messages: ChatMessage[]): Promise<T> {
    const url = `${this.config.baseUrl.replace(/\/$/, '')}/chat/completions`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${this.config.apiKey}`
      },
      body: JSON.stringify({
        model: this.config.model,
        messages,
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens,
        response_format: { type: 'json_object' }
      })
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`LLM request failed ${res.status}: ${text.slice(0, 500)}`);
    }

    const json = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
    const content = json.choices?.[0]?.message?.content;
    if (!content) throw new Error('LLM response missing content');

    try {
      return JSON.parse(content) as T;
    } catch {
      const match = content.match(/\{[\s\S]*\}/);
      if (match) return JSON.parse(match[0]) as T;
      throw new Error(`LLM response was not JSON: ${content.slice(0, 300)}`);
    }
  }

  private safePlayer(player: Player) {
    return {
      id: player.id,
      displayName: player.displayName,
      kind: player.kind,
      agentPersonaId: player.agentPersonaId,
      alive: player.alive
    };
  }

  private publicGameView(state: GameState) {
    return {
      id: state.id,
      round: state.round,
      phase: state.phase,
      players: state.players.map((p) => this.safePlayer(p)),
      publicEvents: state.events
        .filter((e) => e.publicText)
        .slice(-24)
        .map((e) => ({ round: e.round, phase: e.phase, type: e.type, actorId: e.actorId, targetId: e.targetId, publicText: e.publicText }))
    };
  }

  private roleHint(role?: Role): string {
    switch (role) {
      case 'wolf':
        return 'You are secretly a wolf. Blend in, redirect suspicion, protect other wolves when useful, and eliminate strong villagers.';
      case 'seer':
        return 'You are secretly the seer. Use inspection information carefully without making yourself an easy night target.';
      case 'villager':
        return 'You are a villager. Find wolves through speech, votes, and contradictions.';
      default:
        return 'Play strategically based on available information.';
    }
  }

  private cleanText(value: unknown, fallback: string): string {
    if (typeof value !== 'string') return fallback;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : fallback;
  }
}
