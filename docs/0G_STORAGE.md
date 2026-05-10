# 0G Storage Integration

`src/storage/ZeroGStorageAdapter.ts` uploads game artifacts to 0G Storage through the official TypeScript SDK.

## Why it matters

The hackathon pitch depends on proving that each game creates durable, verifiable AI behavior data:

- full transcript
- public replay data
- final game summary
- reputation delta artifacts
- future agent memory deltas

The engine uses `StorageAdapter`, so local dev and 0G uploads share the same artifact contract.

## Backends

Local default:

```bash
npm run demo
```

0G Storage:

```bash
STORAGE_BACKEND=0g npm run demo
```

Telegram with 0G Storage:

```bash
STORAGE_BACKEND=0g npm run bot:telegram
```

## Environment

```bash
STORAGE_BACKEND=0g
ZEROG_NETWORK=testnet        # testnet | mainnet
ZEROG_STORAGE_MODE=turbo     # turbo | standard
ZEROG_PRIVATE_KEY=0x...      # funded wallet, uploads require gas/storage fee

# Optional overrides; defaults are from 0G docs/starter kit
ZEROG_EVM_RPC=https://evmrpc-testnet.0g.ai
ZEROG_INDEXER_RPC=https://indexer-storage-testnet-turbo.0g.ai
```

Defaults:

- Testnet RPC: `https://evmrpc-testnet.0g.ai`
- Testnet turbo indexer: `https://indexer-storage-testnet-turbo.0g.ai`
- Mainnet RPC: `https://evmrpc.0g.ai`
- Mainnet turbo indexer: `https://indexer-storage-turbo.0g.ai`

## Current artifact shape

`putJson(path, value)` wraps data as:

```json
{
  "path": "<logical artifact path>",
  "contentType": "application/json",
  "createdAt": "<iso timestamp>",
  "value": {}
}
```

Returned artifact:

```ts
{
  uri: "0g://testnet/turbo/<rootHash>",
  root: "<0G root hash>",
  txHash: "<upload tx hash>",
  localSha256: "<local sha256 of wrapped payload>",
  metadata: { network, mode, evmRpc, indexerRpc, path }
}
```

## Notes

- Uploads require a funded 0G wallet.
- Downloads do not require a private key, but download support is not wired into the app yet.
- Standard mode may be under maintenance according to the starter kit notes; prefer turbo for demo.
- For private role/action logs, future versions should encrypt before upload.
