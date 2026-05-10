import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { ethers } from 'ethers';
import { createHash } from 'node:crypto';

function sha256Json(value) {
  return '0x' + createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith('--')) continue;
    const key = token.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith('--')) {
      args[key] = '1';
      continue;
    }
    args[key] = next;
    i += 1;
  }
  return args;
}

function winnerLabel(value) {
  return Number(value) === 1 ? 'wolves' : Number(value) === 2 ? 'villagers' : 'unknown';
}

async function loadJson(path) {
  return JSON.parse(await readFile(resolve(path), 'utf8'));
}

const args = parseArgs(process.argv.slice(2));
const manifestPath = args.manifest ?? 'web/data/latest-demo.json';
const manifest = await loadJson(manifestPath);
const gameId = args.gameId ?? manifest.gameId;
if (!gameId) throw new Error('Missing gameId; pass --gameId or --manifest with gameId');

const deployment = await loadJson(args.deployment ?? 'deployments/0g-galileo.GameRegistry.json');
const artifact = await loadJson('artifacts/contracts/GameRegistry.json');
const rpc = args.rpc ?? process.env.ZEROG_EVM_RPC ?? deployment.rpc ?? 'https://evmrpc-testnet.0g.ai';
const registryAddress = args.address ?? manifest.chain?.registryAddress ?? deployment.address;
if (!registryAddress) throw new Error('Missing registry address');

const rawTranscript = await loadJson(`artifacts/${gameId}/transcript.json`);
const rawSummary = await loadJson(`artifacts/${gameId}/summary.raw.json`);
const provider = new ethers.JsonRpcProvider(rpc);
const contract = new ethers.Contract(registryAddress, artifact.abi, provider);
const gameKey = ethers.id(gameId);
const record = await contract.games(gameKey);

const computedTranscriptRoot = sha256Json(rawTranscript);
const computedSummaryRoot = sha256Json(rawSummary);
const uploadedTranscriptRoot = manifest.rawArtifacts?.transcript?.root ?? null;
const uploadedSummaryRoot = manifest.rawArtifacts?.summary?.root ?? null;
const recordedTranscriptRoot = String(record.transcriptRoot);
const recordedSummaryRoot = String(record.summaryRoot);
const result = {
  gameId,
  gameKey,
  registryAddress,
  rpc,
  finalized: Boolean(record.finalized),
  creator: String(record.creator),
  startedAt: Number(record.startedAt),
  finishedAt: Number(record.finishedAt),
  winnerEnum: Number(record.winner),
  winner: winnerLabel(record.winner),
  computed: {
    transcriptSha256: computedTranscriptRoot,
    summarySha256: computedSummaryRoot
  },
  uploaded: {
    transcriptRoot: uploadedTranscriptRoot,
    summaryRoot: uploadedSummaryRoot
  },
  onchain: {
    transcriptRoot: recordedTranscriptRoot,
    summaryRoot: recordedSummaryRoot,
    reputationRoot: String(record.reputationRoot)
  },
  matches: {
    transcriptRoot: Boolean(uploadedTranscriptRoot) && uploadedTranscriptRoot.toLowerCase() === recordedTranscriptRoot.toLowerCase(),
    summaryRoot: Boolean(uploadedSummaryRoot) && uploadedSummaryRoot.toLowerCase() === recordedSummaryRoot.toLowerCase(),
    winner: winnerLabel(record.winner) === rawSummary.winner
  }
};

console.log(JSON.stringify(result, null, 2));
if (!result.finalized || !result.matches.transcriptRoot || !result.matches.summaryRoot || !result.matches.winner) {
  process.exitCode = 1;
}
