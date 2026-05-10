import { readFileSync } from 'node:fs';
import { MockGameRegistryAdapter, type GameRegistryAdapter } from './GameRegistryAdapter.js';
import { ZeroGGameRegistryAdapter } from './ZeroGGameRegistryAdapter.js';

function resolveRegistryAddress(): string {
  if (process.env.GAME_REGISTRY_ADDRESS) return process.env.GAME_REGISTRY_ADDRESS;
  try {
    const deployment = JSON.parse(readFileSync('deployments/0g-galileo.GameRegistry.json', 'utf8')) as { address?: string };
    return deployment.address ?? '';
  } catch {
    return '';
  }
}

export function createGameRegistryAdapter(): GameRegistryAdapter {
  const backend = (process.env.CHAIN_BACKEND ?? 'mock').toLowerCase();
  if (backend === 'mock') return new MockGameRegistryAdapter();
  if (backend === '0g' || backend === 'zerog') return new ZeroGGameRegistryAdapter(resolveRegistryAddress());
  throw new Error(`Unsupported CHAIN_BACKEND: ${backend}`);
}
