import type { GameSummary, GameState } from '../types/game.js';

export interface ChainGameRecord {
  txHash: string;
  createTxHash?: string;
  gameId: string;
  gameKey?: string;
  registryAddress?: string;
  transcriptRoot: string;
  summaryRoot: string;
  reputationRoot?: string;
}

export interface GameRegistryAdapter {
  finalizeGame(state: GameState, summary: GameSummary, transcriptRoot: string, summaryRoot: string): Promise<ChainGameRecord>;
}

export class MockGameRegistryAdapter implements GameRegistryAdapter {
  async finalizeGame(state: GameState, summary: GameSummary, transcriptRoot: string, summaryRoot: string): Promise<ChainGameRecord> {
    return {
      txHash: `mock-tx-${state.id}`,
      gameId: state.id,
      transcriptRoot,
      summaryRoot
    };
  }
}
