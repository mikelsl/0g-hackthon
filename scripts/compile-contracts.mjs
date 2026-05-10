import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import solc from 'solc';

const contractPath = process.argv[2] || 'contracts/GameRegistry.sol';
const source = await readFile(contractPath, 'utf8');
const fileName = path.basename(contractPath);
const input = {
  language: 'Solidity',
  sources: { [fileName]: { content: source } },
  settings: {
    optimizer: { enabled: true, runs: 200 },
    outputSelection: { '*': { '*': ['abi', 'evm.bytecode.object'] } }
  }
};
const output = JSON.parse(solc.compile(JSON.stringify(input)));
const errors = output.errors?.filter((e) => e.severity === 'error') ?? [];
if (errors.length) {
  console.error(JSON.stringify(errors, null, 2));
  process.exit(1);
}
await mkdir('artifacts/contracts', { recursive: true });
for (const [name, artifact] of Object.entries(output.contracts[fileName])) {
  const out = {
    contractName: name,
    abi: artifact.abi,
    bytecode: `0x${artifact.evm.bytecode.object}`
  };
  await writeFile(`artifacts/contracts/${name}.json`, `${JSON.stringify(out, null, 2)}\n`);
  console.log(`Compiled ${name} -> artifacts/contracts/${name}.json`);
}
