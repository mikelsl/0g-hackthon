# LLM Compute Adapter

`src/compute/LlmComputeAdapter.ts` provides an OpenAI-compatible implementation of `ComputeAdapter`.

## Why this matters for 0G

The game engine talks only to `ComputeAdapter`, not to a specific LLM vendor. That lets us use:

- local mock compute for tests and deterministic demos
- OpenAI-compatible endpoints during development
- 0G Compute/OpenAI-compatible endpoint when available

This preserves the hackathon architecture: AI reasoning is a replaceable decentralized compute layer.

## Environment

Copy `.env.example` and set:

```bash
LLM_BASE_URL=https://api.openai.com/v1
LLM_API_KEY=...
LLM_MODEL=gpt-4o-mini
```

For 0G Compute / OpenAI-compatible endpoints, the app supports a speech-only hybrid mode:

```bash
COMPUTE_BACKEND=0g-speech
ZEROG_COMPUTE_BASE_URL=https://compute-network-6.integratenetwork.work/v1/proxy
ZEROG_COMPUTE_API_KEY=...
ZEROG_COMPUTE_MODEL=qwen/qwen-2.5-7b-instruct
LLM_TEMPERATURE=0.95
LLM_MAX_TOKENS=420
```

`0g-speech` uses Qwen 2.5 7B Instruct exposed through a 0G Compute/OpenAI-compatible provider for public speeches, while keeping vote / kill / seer target choices on deterministic mock logic. This avoids burning many inference calls and keeps Telegram demos stable, but removes the obvious repeated speech templates. The current tested Direct provider is `qwen/qwen-2.5-7b-instruct` at `https://compute-network-6.integratenetwork.work/v1/proxy`.

Alternative 0G Router base URLs from 0G docs:

- testnet: `https://router-api-testnet.integratenetwork.work/v1`
- mainnet: `https://router-api.0g.ai/v1`

Model discovery:

```bash
curl https://router-api-testnet.integratenetwork.work/v1/models
```

## Commands

Stable mock demo:

```bash
npm run demo
```

Real LLM demo:

```bash
npm run demo:llm
```

## 0G Direct helper scripts

The repository includes local helper scripts for Compute ledger funding and API-key generation:

```bash
ZEROG_PRIVATE_KEY=0x... node scripts/compute-ledger-account.mjs --execute
ZEROG_PRIVATE_KEY=0x... PROVIDER=0x... AMOUNT=1 node scripts/compute-provider-fund.mjs --execute
ZEROG_PRIVATE_KEY=0x... node scripts/generate-0g-compute-api-key.mjs
```

Secrets are loaded from environment variables by default. A local-only `WALLET_CONFIG_PATH` may be used during development, but it must never be committed or published. Generated API keys are written under `secrets/`, which is gitignored.

## Output Contract

The adapter asks the model to return compact JSON only:

- public speech: `{ publicText, privateNote }`
- target choice: `{ targetId, privateNote }`

If the model chooses an illegal target, the adapter safely falls back to the first legal candidate.

## Current Limitations

- Human speech is still placeholder text in local demo.
- Private reasoning is stored in local transcript; future versions should separate public replay from private audit data.
- The speech adapter has basic 429 retry/backoff and request spacing for low-RPM 0G Direct providers.
- Direct provider funding/API-key generation uses the 0G Compute TypeScript SDK helper scripts; runtime inference uses the OpenAI-compatible endpoint.
