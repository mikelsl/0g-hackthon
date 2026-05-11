import { ethers } from 'ethers';

const rpc = process.env.ZEROG_EVM_RPC || 'https://evmrpc-testnet.0g.ai';
const destination = process.env.SWEEP_DESTINATION;
const sourceKeys = (process.env.SWEEP_PRIVATE_KEYS || '')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);

if (!destination) throw new Error('Missing SWEEP_DESTINATION');
if (sourceKeys.length === 0) throw new Error('Missing SWEEP_PRIVATE_KEYS comma-separated private keys');

const provider = new ethers.JsonRpcProvider(rpc);
const mode = process.argv.includes('--execute') ? 'execute' : 'dry-run';
const gasLimit = 21_000n;
const feeData = await provider.getFeeData();
const gasPrice = ((feeData.gasPrice ?? ethers.parseUnits('1', 'gwei')) * 12n) / 10n;
const gasCost = gasPrice * gasLimit;

const sources = sourceKeys.map((pk, index) => ({
  label: `source-${index + 1}`,
  wallet: new ethers.Wallet(pk.startsWith('0x') ? pk : `0x${pk}`, provider)
}));

console.log(JSON.stringify({
  mode,
  rpc,
  chainId: Number((await provider.getNetwork()).chainId),
  destination: ethers.getAddress(destination),
  sourceCount: sources.length,
  gasPriceGwei: ethers.formatUnits(gasPrice, 'gwei'),
  gasCost0g: ethers.formatEther(gasCost)
}, null, 2));

let totalSweepable = 0n;
const rows = [];
for (const source of sources) {
  const balance = await provider.getBalance(source.wallet.address);
  const sweepable = balance > gasCost ? balance - gasCost : 0n;
  totalSweepable += sweepable;
  rows.push({
    label: source.label,
    address: source.wallet.address,
    balance0g: ethers.formatEther(balance),
    sweepable0g: ethers.formatEther(sweepable)
  });
}
console.table(rows);
console.log(`totalSweepable0g=${ethers.formatEther(totalSweepable)}`);

if (mode !== 'execute') process.exit(0);

for (const source of sources) {
  const balance = await provider.getBalance(source.wallet.address);
  const value = balance > gasCost ? balance - gasCost : 0n;
  if (value <= 0n) {
    console.log(`${source.label}: skipped, insufficient balance`);
    continue;
  }
  const tx = await source.wallet.sendTransaction({ to: destination, value, gasLimit, gasPrice });
  console.log(`${source.label}: sent ${ethers.formatEther(value)} 0G tx=${tx.hash}`);
  const receipt = await tx.wait();
  console.log(`${source.label}: confirmed block=${receipt?.blockNumber}`);
}

const finalDestinationBalance = await provider.getBalance(destination);
console.log(`destinationBalance0g=${ethers.formatEther(finalDestinationBalance)}`);
