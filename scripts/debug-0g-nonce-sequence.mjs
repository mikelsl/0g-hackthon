import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { ethers } from 'ethers';
import { createStorageAdapter } from '../src/storage/createStorageAdapter.js';
import { createGameRegistryAdapter } from '../src/chain/createGameRegistryAdapter.js';

function loadDotEnv(path = '.env') {
  try {
    const raw = readFileSync(path, 'utf8');
    for (const line of raw.split(/\r?\n/)) {
      if (!line || line.trim().startsWith('#') || !line.includes('=')) continue;
      const [key, ...rest] = line.split('=');
      if (!(key in process.env)) process.env[key] = rest.join('=');
    }
  } catch {}
}

async function nonceState(provider, address, label) {
  const latest = await provider.getTransactionCount(address, 'latest');
  const pending = await provider.getTransactionCount(address, 'pending');
  const balance = await provider.getBalance(address);
  console.log(JSON.stringify({ label, address, latest, pending, balance0g: ethers.formatEther(balance) }));
}

function fakeState(id) {
  return {
    id,
    phase: 'ended',
    round: 1,
    players: [
      { id: 'u-demo', displayName: 'Demo Human', kind: 'human', role: 'villager', alive: false },
      { id: 'a1', displayName: 'Ada', kind: 'agent', role: 'wolf', alive: true },
      { id: 'a2', displayName: 'Charm', kind: 'agent', role: 'seer', alive: false }
    ],
    events: [
      { type: 'speech', round: 1, playerId: 'u-demo', publicText: 'Demo speech.' },
      { type: 'vote', round: 1, playerId: 'u-demo', targetId: 'a2', publicText: 'Demo Human voted Charm.' },
      { type: 'gameEnd', round: 1, publicText: 'Winner: wolves' }
    ],
    winner: 'wolves'
  };
}

function fakeSummary(id) {
  return {
    gameId: id,
    winner: 'wolves',
    eliminated: ['a2'],
    survivingPlayers: ['a1'],
    reputationDeltas: { 'u-demo': -1, a1: 2, a2: -1 },
    agentMemories: {
      a1: { playerId: 'a1', personaId: 'analyst', lessons: ['nonce test'], trust: {}, suspicion: {}, lastGameId: id }
    }
  };
}

loadDotEnv();
process.env.STORAGE_BACKEND = '0g';
process.env.CHAIN_BACKEND = '0g';
process.env.UPDATE_LATEST_REPLAY = 'false';
process.env.TELEGRAM_UPDATE_LATEST_REPLAY = '0';

const id = `nonce-debug-${Date.now()}-${randomUUID().slice(0, 8)}`;
const rpc = process.env.ZEROG_EVM_RPC || 'https://evmrpc-testnet.0g.ai';
const pk = process.env.ZEROG_PRIVATE_KEY || process.env.PRIVATE_KEY;
if (!pk) throw new Error('Missing ZEROG_PRIVATE_KEY');
const provider = new ethers.JsonRpcProvider(rpc);
const wallet = new ethers.Wallet(pk, provider);
const storage = createStorageAdapter();
const chain = createGameRegistryAdapter();
const state = fakeState(id);
const summary = fakeSummary(id);

console.log(JSON.stringify({ id, rpc, wallet: wallet.address, registry: process.env.GAME_REGISTRY_ADDRESS }));
await nonceState(provider, wallet.address, 'start');

console.log('upload raw transcript');
const rawTranscript = await storage.putJson(`${id}/transcript.json`, state.events);
await nonceState(provider, wallet.address, 'after raw transcript');
console.log('rawTranscript', rawTranscript.txHash, rawTranscript.root);

console.log('upload raw summary');
const rawSummary = await storage.putJson(`${id}/summary.raw.json`, summary);
await nonceState(provider, wallet.address, 'after raw summary');
console.log('rawSummary', rawSummary.txHash, rawSummary.root);

console.log('chain finalize');
const chainRecord = await chain.finalizeGame(state, summary, rawTranscript.root, rawSummary.root);
await nonceState(provider, wallet.address, 'after chain finalize');
console.log('chainRecord', JSON.stringify(chainRecord));

console.log('upload public');
const pub = await storage.putJson(`${id}/public-transcript.json`, state.events);
await nonceState(provider, wallet.address, 'after public');
console.log('pub', pub.txHash, pub.root);

console.log('upload private');
const priv = await storage.putJson(`${id}/private-audit-transcript.json`, state.events);
await nonceState(provider, wallet.address, 'after private');
console.log('priv', priv.txHash, priv.root);

console.log('upload summary');
const sum = await storage.putJson(`${id}/summary.json`, summary);
await nonceState(provider, wallet.address, 'after summary');
console.log('sum', sum.txHash, sum.root);

console.log('OK');
