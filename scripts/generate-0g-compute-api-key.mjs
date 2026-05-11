import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { ethers } from 'ethers';
import { createZGComputeNetworkBroker } from '@0gfoundation/0g-compute-ts-sdk';
import { loadComputePrivateKey } from './compute-wallet.mjs';

const providerAddress = process.env.PROVIDER || '0xa48f01287233509FD694a22Bf840225062E67836'; // cheapest available text provider: qwen/qwen-2.5-7b-instruct
const tokenId = process.env.TOKEN_ID ? Number(process.env.TOKEN_ID) : 0;
const rpc = process.env.ZEROG_EVM_RPC || 'https://evmrpc-testnet.0g.ai';
const privateKey = loadComputePrivateKey();

const provider = new ethers.JsonRpcProvider(rpc);
const wallet = new ethers.Wallet(privateKey, provider);
const broker = await createZGComputeNetworkBroker(wallet);
const services = await broker.inference.listService();
const service = services.find((s) => String(s[0]).toLowerCase() === providerAddress.toLowerCase());
const { endpoint, model } = await broker.inference.getServiceMetadata(providerAddress);
const keyInfo = await broker.inference.requestProcessor.createApiKey(providerAddress, { tokenId });

const record = {
  createdAtIso: new Date().toISOString(),
  network: '0G Galileo Testnet',
  rpc,
  wallet: wallet.address,
  providerAddress,
  endpoint,
  model,
  tokenId: keyInfo.tokenId,
  expiresAt: keyInfo.expiresAt,
  rawToken: keyInfo.rawToken,
  note: '0G Compute Direct persistent API key. Treat as secret. Authorization: Bearer <rawToken>.'
};

const secretPath = resolve(process.env.ZEROG_COMPUTE_SECRET_PATH || 'secrets/0g-compute-api-key.json');
mkdirSync(dirname(secretPath), { recursive: true });
writeFileSync(secretPath, JSON.stringify(record, null, 2));

console.log(JSON.stringify({
  createdAtIso: record.createdAtIso,
  providerAddress,
  endpoint,
  model,
  tokenId: keyInfo.tokenId,
  expiresAt: keyInfo.expiresAt,
  keyPrefix: keyInfo.rawToken.slice(0, 22),
  keyLength: keyInfo.rawToken.length,
  secretPath
}, null, 2));
