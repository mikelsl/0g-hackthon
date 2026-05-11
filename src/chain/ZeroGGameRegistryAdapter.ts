import { readFile } from 'node:fs/promises';
import { ethers, type InterfaceAbi } from 'ethers';
import type { GameSummary, GameState } from '../types/game.js';
import type { ChainGameRecord, GameRegistryAdapter } from './GameRegistryAdapter.js';
import { sha256Json } from '../utils/hash.js';

const DEFAULT_RPC = 'https://evmrpc-testnet.0g.ai';

function asBytes32(value: string): string {
  if (/^0x[a-fA-F0-9]{64}$/.test(value)) return value;
  return ethers.id(value);
}

function winnerEnum(winner: GameSummary['winner']): number {
  return winner === 'wolves' ? 1 : 2;
}

export class ZeroGGameRegistryAdapter implements GameRegistryAdapter {
  private abiPromise?: Promise<InterfaceAbi>;

  constructor(
    private readonly address = process.env.GAME_REGISTRY_ADDRESS ?? '',
    private readonly rpc = process.env.ZEROG_EVM_RPC ?? DEFAULT_RPC,
    private readonly privateKey = process.env.ZEROG_PRIVATE_KEY ?? process.env.PRIVATE_KEY ?? ''
  ) {
    if (!this.address) throw new Error('Missing GAME_REGISTRY_ADDRESS for 0G GameRegistry');
    if (!this.privateKey) throw new Error('Missing ZEROG_PRIVATE_KEY or PRIVATE_KEY for 0G GameRegistry');
  }

  async finalizeGame(state: GameState, summary: GameSummary, transcriptRoot: string, summaryRoot: string): Promise<ChainGameRecord> {
    const provider = new ethers.JsonRpcProvider(this.rpc);
    const signer = new ethers.Wallet(this.privateKey, provider);
    const contract = new ethers.Contract(this.address, await this.loadAbi(), signer);
    let nonce = await provider.getTransactionCount(signer.address, 'pending');
    const gameKey = ethers.id(state.id);
    const reputationRoot = asBytes32(sha256Json(summary.reputationDeltas));

    const existing = await contract.games(gameKey);
    let createTxHash: string | undefined;
    if (existing.creator === ethers.ZeroAddress) {
      const createTx = await contract.createGame(gameKey, { nonce: nonce++ });
      const createReceipt = await createTx.wait();
      createTxHash = createReceipt.hash;
    }

    const finalizeTx = await contract.finalizeGame(
      gameKey,
      winnerEnum(summary.winner),
      asBytes32(transcriptRoot),
      asBytes32(summaryRoot),
      reputationRoot,
      { nonce: nonce++ }
    );
    const finalizeReceipt = await finalizeTx.wait();

    return {
      txHash: finalizeReceipt.hash,
      createTxHash,
      gameId: state.id,
      gameKey,
      registryAddress: this.address,
      transcriptRoot,
      summaryRoot,
      reputationRoot
    };
  }

  private loadAbi(): Promise<InterfaceAbi> {
    this.abiPromise ??= readFile('artifacts/contracts/GameRegistry.json', 'utf8')
      .then((raw) => JSON.parse(raw).abi as InterfaceAbi);
    return this.abiPromise;
  }
}
