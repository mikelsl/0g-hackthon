import type { ChainGameRecord } from '../chain/GameRegistryAdapter.js';
import type { StorageAdapter, StoredArtifact } from '../storage/StorageAdapter.js';
import type { GameState, GameSummary } from '../types/game.js';
import { buildTranscriptViews } from '../transcript/transcriptViews.js';
import { updateGameIndex } from '../web/gameIndex.js';
import { writeReplayManifest } from '../web/replayManifest.js';

export interface PersistGameArtifactsResult {
  publicTranscriptArtifact: StoredArtifact;
  privateAuditTranscriptArtifact: StoredArtifact;
  summaryArtifact: StoredArtifact;
}

export async function persistGameArtifacts(
  storage: StorageAdapter,
  state: GameState,
  summary: GameSummary,
  chainRecord: ChainGameRecord,
  options?: {
    manifestPath?: string;
    latestManifestPath?: string;
    engine?: string;
    rawTranscriptArtifact?: StoredArtifact;
    rawSummaryArtifact?: StoredArtifact;
  }
): Promise<PersistGameArtifactsResult> {
  const { publicTranscript, privateAuditTranscript } = buildTranscriptViews(state.events);
  const publicTranscriptArtifact = await storage.putJson(`${state.id}/public-transcript.json`, publicTranscript);
  const privateAuditTranscriptArtifact = await storage.putJson(`${state.id}/private-audit-transcript.json`, privateAuditTranscript);
  const summaryArtifact = await storage.putJson(`${state.id}/summary.json`, summary);

  const registryLabel = chainRecord.registryAddress
    ? `0G GameRegistry ${chainRecord.registryAddress}`
    : 'Mock registry';

  if (options?.manifestPath) {
    await writeReplayManifest(options.manifestPath, {
      gameId: state.id,
      summary,
      transcriptArtifact: publicTranscriptArtifact,
      auditTranscriptArtifact: privateAuditTranscriptArtifact,
      summaryArtifact,
      rawTranscriptArtifact: options?.rawTranscriptArtifact,
      rawSummaryArtifact: options?.rawSummaryArtifact,
      eventCount: state.events.length,
      engine: options.engine,
      registry: registryLabel,
      chainRecord
    });
  }

  if (options?.latestManifestPath) {
    await writeReplayManifest(options.latestManifestPath, {
      gameId: state.id,
      summary,
      transcriptArtifact: publicTranscriptArtifact,
      auditTranscriptArtifact: privateAuditTranscriptArtifact,
      summaryArtifact,
      rawTranscriptArtifact: options?.rawTranscriptArtifact,
      rawSummaryArtifact: options?.rawSummaryArtifact,
      eventCount: state.events.length,
      engine: options.engine,
      registry: registryLabel,
      chainRecord
    });
  }

  if (options?.manifestPath) {
    await updateGameIndex('web/data/game-index.json', {
      gameId: state.id,
      winner: summary.winner,
      eventCount: state.events.length,
      generatedAt: new Date().toISOString(),
      networkLabel: publicTranscriptArtifact.metadata?.network === 'testnet' ? '0G Galileo Testnet' : publicTranscriptArtifact.metadata?.network === 'mainnet' ? '0G Mainnet' : 'Local Dev',
      storageMode: publicTranscriptArtifact.metadata?.network ? `0G Storage ${publicTranscriptArtifact.metadata?.mode ?? 'json'}` : 'Local JSON artifacts',
      manifestPath: options.manifestPath,
      registry: registryLabel
    });
  }

  return {
    publicTranscriptArtifact,
    privateAuditTranscriptArtifact,
    summaryArtifact
  };
}
