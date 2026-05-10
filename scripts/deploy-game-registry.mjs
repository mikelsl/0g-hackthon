import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { ethers } from 'ethers';

const rpc = process.env.ZEROG_EVM_RPC || 'https://evmrpc-testnet.0g.ai';
const privateKey = process.env.ZEROG_PRIVATE_KEY || process.env.PRIVATE_KEY;
if (!privateKey) throw new Error('Missing ZEROG_PRIVATE_KEY or PRIVATE_KEY');

const artifact = JSON.parse(await readFile('artifacts/contracts/GameRegistry.json', 'utf8'));
const provider = new ethers.JsonRpcProvider(rpc);
const wallet = new ethers.Wallet(privateKey, provider);
const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);

console.log(`Deploying GameRegistry from ${wallet.address} to ${rpc}`);
const contract = await factory.deploy();
const receipt = await contract.deploymentTransaction().wait();
const address = await contract.getAddress();
const deployment = {
  network: '0g-galileo-testnet',
  rpc,
  contract: 'GameRegistry',
  address,
  deployer: wallet.address,
  txHash: receipt.hash,
  blockNumber: receipt.blockNumber,
  deployedAt: new Date().toISOString()
};
await mkdir('deployments', { recursive: true });
await writeFile('deployments/0g-galileo.GameRegistry.json', `${JSON.stringify(deployment, null, 2)}\n`);
console.log(JSON.stringify(deployment, null, 2));
