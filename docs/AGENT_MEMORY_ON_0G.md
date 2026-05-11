# Agent Memory on 0G

0G MindGames Arena stores agent memory as first-class 0G Storage artifacts, not just hidden prompt text.

## Schema

Current schema version:

```text
0g-mindgames.agent-memory.v1
```

Each completed game can publish three memory artifacts through the same `StorageAdapter` used for transcripts and summaries.

## Layers

### 1. Current-game memory

Path:

```text
<gameId>/memory/current-game-memory.v1.json
```

Purpose:

- observable facts from this match only
- speeches
- votes cast / received
- mentions
- private self-knowledge such as a Seer player's own checks

Rule:

> An agent may only claim someone has suspicious tone, behavior, votes, or speech in the current game if that claim is grounded in this layer.

### 2. Cross-game memory

Path:

```text
<gameId>/memory/cross-game-memory.v1.json
```

Purpose:

- post-game agent memory snapshots
- long-term tendency / adaptation for future games
- trust and suspicion carry-over as a weak prior

Rule:

> Cross-game memory can be used as a tie-breaker or explicitly named as past-game memory. It must not be presented as current-game evidence.

### 3. Agent memory manifest

Path:

```text
<gameId>/memory/agent-memory-manifest.v1.json
```

Purpose:

- links the current-game memory root and cross-game memory root
- records the memory model policy
- gives judges one canonical memory entry point

## 0G alignment

The implementation uses the official 0G Storage TypeScript SDK:

```ts
Indexer.upload(MemData, evmRpc, signer)
```

Returned roots are used as content-addressed artifact identifiers:

```text
0g://<network>/<mode>/<rootHash>
```

For hackathon reliability the default mode is 0G Storage turbo. The adapter keeps mode/network configurable so standard mode or mainnet can be used later without changing game logic.

## Privacy note

The hackathon MVP publishes memory artifacts after game completion for judge verification. Production should encrypt private role/action and private reasoning layers before upload, while keeping public replay and summary artifacts openly verifiable.
