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

For 0G Compute, replace `LLM_BASE_URL`, `LLM_API_KEY`, and `LLM_MODEL` with the 0G Compute endpoint/model config.

## Commands

Stable mock demo:

```bash
npm run demo
```

Real LLM demo:

```bash
npm run demo:llm
```

## Output Contract

The adapter asks the model to return compact JSON only:

- public speech: `{ publicText, privateNote }`
- target choice: `{ targetId, privateNote }`

If the model chooses an illegal target, the adapter safely falls back to the first legal candidate.

## Current Limitations

- Human speech is still placeholder text in local demo.
- Private reasoning is stored in local transcript; future versions should separate public replay from private audit data.
- No retry/backoff yet.
- No 0G Compute SDK binding yet; endpoint-compatible adapter is prepared for it.
