import { readFileSync } from 'node:fs';

export function loadComputePrivateKey() {
  const direct = process.env.ZEROG_PRIVATE_KEY || process.env.PRIVATE_KEY;
  if (direct) return normalizePrivateKey(direct);

  const walletConfigPath = process.env.WALLET_CONFIG_PATH;
  if (!walletConfigPath) {
    throw new Error('Missing ZEROG_PRIVATE_KEY / PRIVATE_KEY. Optionally set WALLET_CONFIG_PATH for a local-only wallet config file.');
  }

  const walletLabel = process.env.WALLET_LABEL || 'cornerstone';
  const config = JSON.parse(readFileSync(walletConfigPath, 'utf8'));
  const walletConfig = config.wallets?.find((wallet) => wallet.label === walletLabel);
  if (!walletConfig?.private_key_hex) {
    throw new Error(`Wallet label ${walletLabel} not found in WALLET_CONFIG_PATH`);
  }
  return normalizePrivateKey(walletConfig.private_key_hex);
}

function normalizePrivateKey(value) {
  return value.startsWith('0x') ? value : `0x${value}`;
}
