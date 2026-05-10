import { ethers } from 'ethers';
import { Indexer, MemData } from '@0gfoundation/0g-storage-ts-sdk';
import type { StorageAdapter, StoredArtifact } from './StorageAdapter.js';
import { sha256Json } from '../utils/hash.js';

export type ZeroGNetwork = 'testnet' | 'mainnet';
export type ZeroGStorageMode = 'turbo' | 'standard';

interface ZeroGStorageConfig {
  network: ZeroGNetwork;
  mode: ZeroGStorageMode;
  evmRpc: string;
  indexerRpc: string;
  privateKey: string;
}

const DEFAULTS: Record<ZeroGNetwork, Record<ZeroGStorageMode, { evmRpc: string; indexerRpc: string }>> = {
  testnet: {
    turbo: {
      evmRpc: 'https://evmrpc-testnet.0g.ai',
      indexerRpc: 'https://indexer-storage-testnet-turbo.0g.ai'
    },
    standard: {
      evmRpc: 'https://evmrpc-testnet.0g.ai',
      indexerRpc: 'https://indexer-storage-testnet-standard.0g.ai'
    }
  },
  mainnet: {
    turbo: {
      evmRpc: 'https://evmrpc.0g.ai',
      indexerRpc: 'https://indexer-storage-turbo.0g.ai'
    },
    standard: {
      evmRpc: 'https://evmrpc.0g.ai',
      indexerRpc: 'https://indexer-storage.0g.ai'
    }
  }
};

export class ZeroGStorageAdapter implements StorageAdapter {
  private readonly config: ZeroGStorageConfig;

  constructor(config?: Partial<ZeroGStorageConfig>) {
    const network = (config?.network ?? process.env.ZEROG_NETWORK ?? 'testnet') as ZeroGNetwork;
    const mode = (config?.mode ?? process.env.ZEROG_STORAGE_MODE ?? 'turbo') as ZeroGStorageMode;
    if (!DEFAULTS[network]?.[mode]) throw new Error(`Unsupported 0G storage config: ${network}/${mode}`);
    const defaults = DEFAULTS[network][mode];
    const privateKey = config?.privateKey ?? process.env.ZEROG_PRIVATE_KEY ?? process.env.PRIVATE_KEY ?? '';
    if (!privateKey) throw new Error('Missing ZEROG_PRIVATE_KEY or PRIVATE_KEY for 0G Storage upload');
    this.config = {
      network,
      mode,
      privateKey,
      evmRpc: config?.evmRpc ?? process.env.ZEROG_EVM_RPC ?? defaults.evmRpc,
      indexerRpc: config?.indexerRpc ?? process.env.ZEROG_INDEXER_RPC ?? defaults.indexerRpc
    };
  }

  async putJson(path: string, value: unknown): Promise<StoredArtifact> {
    const payload = {
      path,
      contentType: 'application/json',
      createdAt: new Date().toISOString(),
      value
    };
    const bytes = new TextEncoder().encode(JSON.stringify(payload, null, 2));
    const data = new MemData(bytes);
    const provider = new ethers.JsonRpcProvider(this.config.evmRpc);
    const signer = new ethers.Wallet(this.config.privateKey, provider);
    const indexer = new Indexer(this.config.indexerRpc);

    const [tx, err] = await indexer.upload(data, this.config.evmRpc, signer as never);
    if (err !== null) throw new Error(`0G Storage upload failed: ${String(err)}`);

    const rootHash = this.extractRootHash(tx);
    const txHash = this.extractTxHash(tx);
    return {
      uri: `0g://${this.config.network}/${this.config.mode}/${rootHash}`,
      root: rootHash,
      txHash,
      localSha256: sha256Json(payload),
      metadata: {
        network: this.config.network,
        mode: this.config.mode,
        evmRpc: this.config.evmRpc,
        indexerRpc: this.config.indexerRpc,
        path
      }
    };
  }

  private extractRootHash(tx: unknown): string {
    if (tx && typeof tx === 'object') {
      const obj = tx as { rootHash?: unknown; rootHashes?: unknown };
      if (typeof obj.rootHash === 'string') return obj.rootHash;
      if (Array.isArray(obj.rootHashes) && typeof obj.rootHashes[0] === 'string') return obj.rootHashes[0];
    }
    throw new Error(`0G upload response missing root hash: ${JSON.stringify(tx)}`);
  }

  private extractTxHash(tx: unknown): string | undefined {
    if (tx && typeof tx === 'object') {
      const obj = tx as { txHash?: unknown; txHashes?: unknown };
      if (typeof obj.txHash === 'string') return obj.txHash;
      if (Array.isArray(obj.txHashes) && typeof obj.txHashes[0] === 'string') return obj.txHashes[0];
    }
    return undefined;
  }
}
