import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import type { ChainGameRecord } from '../chain/GameRegistryAdapter.js';
import type { StoredArtifact } from '../storage/StorageAdapter.js';
import type { GameSummary } from '../types/game.js';

export interface ReplayManifestInput {
  gameId: string;
  summary: GameSummary;
  transcriptArtifact: StoredArtifact;
  auditTranscriptArtifact?: StoredArtifact;
  summaryArtifact: StoredArtifact;
  rawTranscriptArtifact?: StoredArtifact;
  rawSummaryArtifact?: StoredArtifact;
  eventCount: number;
  engine?: string;
  registry?: string;
  chainRecord?: ChainGameRecord;
}

const EXPLORER_TX = 'https://chainscan-galileo.0g.ai/tx/';

function artifactLabel(artifact: StoredArtifact): string {
  const meta = artifact.metadata as Record<string, unknown> | undefined;
  const network = typeof meta?.network === 'string' ? meta.network : 'local';
  const mode = typeof meta?.mode === 'string' ? meta.mode : 'json';
  return network === 'local' ? 'Local JSON artifacts' : `0G Storage ${mode}`;
}

function networkLabel(artifact: StoredArtifact): string {
  const meta = artifact.metadata as Record<string, unknown> | undefined;
  const network = typeof meta?.network === 'string' ? meta.network : 'local';
  return network === 'testnet' ? '0G Galileo Testnet' : network === 'mainnet' ? '0G Mainnet' : 'Local Dev';
}

function txUrl(txHash?: string): string | undefined {
  return txHash ? `${EXPLORER_TX}${txHash}` : undefined;
}

export function buildReplayManifest(input: ReplayManifestInput): Record<string, unknown> {
  const storageMode = artifactLabel(input.transcriptArtifact);
  return {
    networkLabel: networkLabel(input.transcriptArtifact),
    storageMode,
    gameId: input.gameId,
    winner: input.summary.winner,
    eventCount: input.eventCount,
    engine: input.engine ?? 'Mock agents + WerewolfEngine MVP',
    registry: input.registry ?? 'Mock registry now; GameRegistry.sol next',
    generatedAt: new Date().toISOString(),
    transcript: {
      uri: input.transcriptArtifact.uri,
      root: input.transcriptArtifact.root,
      txHash: input.transcriptArtifact.txHash ?? null,
      txUrl: txUrl(input.transcriptArtifact.txHash),
      localSha256: input.transcriptArtifact.localSha256 ?? null
    },
    auditTranscript: input.auditTranscriptArtifact ? {
      uri: input.auditTranscriptArtifact.uri,
      root: input.auditTranscriptArtifact.root,
      txHash: input.auditTranscriptArtifact.txHash ?? null,
      txUrl: txUrl(input.auditTranscriptArtifact.txHash),
      localSha256: input.auditTranscriptArtifact.localSha256 ?? null
    } : null,
    summary: {
      uri: input.summaryArtifact.uri,
      root: input.summaryArtifact.root,
      txHash: input.summaryArtifact.txHash ?? null,
      txUrl: txUrl(input.summaryArtifact.txHash),
      localSha256: input.summaryArtifact.localSha256 ?? null
    },
    rawArtifacts: {
      transcript: input.rawTranscriptArtifact ? {
        uri: input.rawTranscriptArtifact.uri,
        root: input.rawTranscriptArtifact.root,
        txHash: input.rawTranscriptArtifact.txHash ?? null,
        txUrl: txUrl(input.rawTranscriptArtifact.txHash),
        localSha256: input.rawTranscriptArtifact.localSha256 ?? null
      } : null,
      summary: input.rawSummaryArtifact ? {
        uri: input.rawSummaryArtifact.uri,
        root: input.rawSummaryArtifact.root,
        txHash: input.rawSummaryArtifact.txHash ?? null,
        txUrl: txUrl(input.rawSummaryArtifact.txHash),
        localSha256: input.rawSummaryArtifact.localSha256 ?? null
      } : null
    },
    chain: input.chainRecord ? {
      registryAddress: input.chainRecord.registryAddress ?? null,
      gameKey: input.chainRecord.gameKey ?? null,
      txHash: input.chainRecord.txHash ?? null,
      txUrl: txUrl(input.chainRecord.txHash),
      createTxHash: input.chainRecord.createTxHash ?? null,
      createTxUrl: txUrl(input.chainRecord.createTxHash),
      recordedTranscriptRoot: input.chainRecord.transcriptRoot,
      recordedSummaryRoot: input.chainRecord.summaryRoot,
      recordedReputationRoot: input.chainRecord.reputationRoot ?? null
    } : null,
    verificationChecklist: [
      storageMode.startsWith('0G')
        ? 'Game summary and transcript were uploaded through the official 0G TypeScript Storage SDK.'
        : 'Game summary and transcript were written through the same StorageAdapter contract used by 0G uploads.',
      'Each artifact has a deterministic root hash for replay verification.',
      input.auditTranscriptArtifact
        ? 'Public replay transcript and private audit transcript are separated so live/group views do not leak hidden role information.'
        : 'Transcript separation is not attached yet; private-role leakage protections should be verified before public demos.',
      input.transcriptArtifact.txHash
        ? '0G Galileo transaction hashes are available for both uploaded artifacts.'
        : 'Run with STORAGE_BACKEND=0g to attach 0G Galileo transaction hashes.',
      input.chainRecord?.registryAddress
        ? 'This replay manifest includes the linked 0G GameRegistry record for contract-level verification.'
        : 'Next milestone: register these roots in GameRegistry.sol on 0G Chain so replay + result verification are both on-chain addressable.'
    ],
    replayPreview: [
      {
        title: 'Match initialized',
        description: 'Six-player Werewolf game starts with one human player and five personality-rich AI agents.'
      },
      {
        title: 'Hidden roles assigned',
        description: 'Roles are randomized and private; public replay is separated from private audit transcript for safer live/group demos.'
      },
      {
        title: 'Social reasoning loop',
        description: 'Agents speak, accuse, defend, vote, and perform night actions through ComputeAdapter-backed reasoning.'
      },
      {
        title: 'Artifacts committed',
        description: 'Full transcript and final summary are uploaded or written as verifiable AI behavior records.'
      },
      {
        title: 'Outcome ready for registry',
        description: 'Winner, roots, and reputation deltas are ready to be recorded in GameRegistry.sol on 0G Galileo.'
      }
    ]
  };
}

export async function writeReplayManifest(filePath: string, input: ReplayManifestInput): Promise<void> {
  const manifest = buildReplayManifest(input);
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(manifest, null, 2)}\n`);
}
