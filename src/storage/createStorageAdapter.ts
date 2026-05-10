import type { StorageAdapter } from './StorageAdapter.js';
import { LocalStorageAdapter } from './LocalStorageAdapter.js';
import { ZeroGStorageAdapter } from './ZeroGStorageAdapter.js';

export function createStorageAdapter(): StorageAdapter {
  const backend = process.env.STORAGE_BACKEND ?? 'local';
  if (backend === '0g' || backend === 'zerog') return new ZeroGStorageAdapter();
  if (backend === 'local') return new LocalStorageAdapter('./artifacts');
  throw new Error(`Unsupported STORAGE_BACKEND: ${backend}`);
}
