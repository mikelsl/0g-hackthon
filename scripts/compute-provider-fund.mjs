import { ethers } from 'ethers';
import { createZGComputeNetworkBroker } from '@0gfoundation/0g-compute-ts-sdk';
import { loadComputePrivateKey } from './compute-wallet.mjs';

const mode = process.argv.includes('--execute') ? 'execute' : 'dry-run';
const providerAddress = process.env.PROVIDER || '0xa48f01287233509FD694a22Bf840225062E67836'; // qwen/qwen-2.5-7b-instruct testnet
const amount = process.env.AMOUNT || '1';
const rpc = process.env.ZEROG_EVM_RPC || 'https://evmrpc-testnet.0g.ai';
const privateKey = loadComputePrivateKey();

const provider = new ethers.JsonRpcProvider(rpc);
const wallet = new ethers.Wallet(privateKey, provider);
const broker = await createZGComputeNetworkBroker(wallet);
const balance = await provider.getBalance(wallet.address);
const feeData = await provider.getFeeData();
const ledgerContract = broker.ledger.ledger.ledgerContract.ledger;
const amountWei = ethers.parseEther(amount);
const gas = await ledgerContract.transferFund.estimateGas(providerAddress, 'inference-v1.0', amountWei, { from: wallet.address });

console.log(JSON.stringify({
  mode,
  wallet: wallet.address,
  provider: providerAddress,
  amount0g: amount,
  walletBalance0g: ethers.formatEther(balance),
  gas: gas.toString(),
  gasPriceGwei: feeData.gasPrice ? ethers.formatUnits(feeData.gasPrice, 'gwei') : null,
  estimatedGasCost0g: feeData.gasPrice ? ethers.formatEther(gas * feeData.gasPrice) : null,
  enoughGas: feeData.gasPrice ? balance > gas * feeData.gasPrice : null,
  ledgerBefore: await broker.ledger.getLedger()
}, (_, v) => typeof v === 'bigint' ? v.toString() : v, 2));

if (mode !== 'execute') process.exit(0);

await broker.ledger.transferFund(providerAddress, 'inference', amountWei);
console.log('transferFundResult=ok');
console.log('walletBalanceAfter0g=', ethers.formatEther(await provider.getBalance(wallet.address)));
console.log('ledgerAfter=', JSON.stringify(await broker.ledger.getLedger(), (_, v) => typeof v === 'bigint' ? v.toString() : v, 2));
console.log('providerAccountAfter=', JSON.stringify(await broker.inference.getAccount(providerAddress), (_, v) => typeof v === 'bigint' ? v.toString() : v, 2));
