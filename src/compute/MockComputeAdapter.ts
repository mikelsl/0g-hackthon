import type { ComputeAdapter, AgentSpeechResult } from './ComputeAdapter.js';
import type { GameState, Player } from '../types/game.js';
import { getPersona } from '../agents/personas.js';

export class MockComputeAdapter implements ComputeAdapter {
  async generateSpeech(player: Player, state: GameState): Promise<AgentSpeechResult> {
    const persona = getPersona(player.agentPersonaId ?? 'analyst');
    const alive = state.players.filter((p) => p.alive && p.id !== player.id);
    const suspect = alive[(state.round + player.id.length) % alive.length];
    return {
      publicText: `${persona.name}: Based on my ${persona.style} read, I want pressure on ${suspect.displayName}. My suspicion is not final, but their pattern feels off this round.`,
      privateNote: `Mock reasoning for ${player.displayName}. Role=${player.role}. Persona=${persona.id}. Suspect=${suspect.id}.`
    };
  }

  async chooseVote(player: Player, state: GameState): Promise<string> {
    const candidates = state.players.filter((p) => p.alive && p.id !== player.id);
    return candidates[(state.round + player.id.charCodeAt(0)) % candidates.length].id;
  }

  async chooseNightKill(wolf: Player, state: GameState): Promise<string> {
    const candidates = state.players.filter((p) => p.alive && p.role !== 'wolf');
    return candidates[(state.round + wolf.id.length) % candidates.length].id;
  }

  async chooseSeerCheck(seer: Player, state: GameState): Promise<string> {
    const candidates = state.players.filter((p) => p.alive && p.id !== seer.id);
    return candidates[(state.round + seer.id.length) % candidates.length].id;
  }
}
