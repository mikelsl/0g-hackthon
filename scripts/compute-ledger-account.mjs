import { ethers } from 'ethers';
import { createZGComputeNetworkBroker } from '@0gfoundation/0g-compute-ts-sdk';
import { loadComputePrivateKey } from './compute-wallet.mjs';

const mode = process.argv.includes('--execute') ? 'execute' : 'dry-run';
const amount = process.env.AMOUNT ?? '3';
const rpc = process.env.ZEROG_EVM_RPC || 'https://evmrpc-testnet.0g.ai';
const privateKey = loadComputePrivateKey();

const provider = new ethers.JsonRpcProvider(rpc);
const wallet = new ethers.Wallet(privateKey, provider);
const broker = await createZGComputeNetworkBroker(wallet);
const net = await provider.getNetwork();
const balance = await provider.getBalance(wallet.address);
const feeData = await provider.getFeeData();

console.log(JSON.stringify({
  mode,
  rpc,
  chainId: net.chainId.toString(),
  wallet: wallet.address,
  walletBalance0g: ethers.formatEther(balance),
  amount0g: amount,
  gasPriceGwei: feeData.gasPrice ? ethers.formatUnits(feeData.gasPrice, 'gwei') : null
}, null, 2));

try {
  const account = await broker.ledger.getLedger();
  console.log('existingLedger=', JSON.stringify(account, (_, v) => typeof v === 'bigint' ? v.toString() : v, 2));
} catch (err) {
  console.log('existingLedgerError=', err instanceof Error ? err.message : String(err));
}

if (mode !== 'execute') {
  console.log('dryRunOnly=true');
  process.exit(0);
}

const tx = await broker.ledger.addLedger(Number(amount));
console.log('addLedgerResult=', JSON.stringify(tx, (_, v) => typeof v === 'bigint' ? v.toString() : v, 2));

const finalBalance = await provider.getBalance(wallet.address);
console.log('finalWalletBalance0g=', ethers.formatEther(finalBalance));
try {
  const account = await broker.ledger.getLedger();
  console.log('finalLedger=', JSON.stringify(account, (_, v) => typeof v === 'bigint' ? v.toString() : v, 2));
} catch (err) {
  console.log('finalLedgerError=', err instanceof Error ? err.message : String(err));
}
