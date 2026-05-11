# 0G MindGames Arena

Verifiable social reasoning games for humans and AI agents on 0G.

**0G MindGames Arena** turns social deduction games into replayable, auditable, onchain-linked AI benchmarks. In the current hackathon MVP, a human and multiple AI agents play **Werewolf**, produce structured match artifacts, upload them to **0G Storage**, and anchor the outcome plus storage roots on **0G Chain**. For hackathon submission, the GameRegistry contract is deployed on **0G Mainnet** with a live finalized proof record.

## Live Demo

- **Verification dashboard:** https://openclaw.yuzu-swap.com/dashboard/0g/
- **Demo video:** https://github.com/mikelsl/0g-hackthon/raw/main/docs/assets/0g-mindgames-demo-v8-side-by-side-seer-with-links-2026-05-11.mp4
- **GitHub repo:** https://github.com/mikelsl/0g-hackthon
- **Deployed GameRegistry (0G Mainnet):** `0x5677F20bD56538F20051Fe8Bf002e6D06780d85c`
- **0G Mainnet contract:** https://chainscan.0g.ai/address/0x5677F20bD56538F20051Fe8Bf002e6D06780d85c
- **0G Mainnet finalized proof tx:** https://chainscan.0g.ai/tx/0x92b37e58678b0e52c7edc805e47fb7f380962c83536fa541f4a85690a0210851
- **Verified live Telegram game:** `tg-1778501266590`

![0G MindGames Arena dashboard](docs/assets/dashboard-live.png)

## What makes this interesting

Most AI demos show chat, tools, or trading.
This project focuses on something harder to fake and more interesting to evaluate:

- social reasoning
- deception and trust calibration
- multi-agent interaction
- replayable, verifiable behavior records

Werewolf is just the first interface.
The longer-term product is a **social intelligence layer for autonomous agents**.

## Hackathon MVP

Current MVP includes:

- human + AI Werewolf match flow
- multiple personality-rich AI players
- 0G Compute Direct speech generation with Qwen 2.5 7B for more varied in-character dialogue
- layered agent memory artifacts for current-game evidence and cross-game priors
- judge-safe **public replay transcript**
- hidden-role **private audit transcript**
- final summary artifact
- 0G Storage upload flow for replay / audit / summary artifacts
- 0G Galileo `GameRegistry` write path
- verification script for comparing local artifacts and onchain records
- web replay browser for multiple recorded matches

## Why 0G

### 0G Storage
Stores durable transcripts, summaries, audit logs, and future agent memory artifacts.

### 0G Chain
Anchors game results, artifact roots, reputation updates, and future tournament / wager settlement.

### 0G Compute
Provides the pluggable reasoning layer for AI players and moderators. The current demo supports 0G Compute Direct through an OpenAI-compatible provider endpoint, using `qwen/qwen-2.5-7b-instruct` for colorful public speeches while deterministic game actions keep live demos stable.

### Verification path
Lets judges verify that uploaded artifacts and contract records match the claimed game outcome.

## Architecture at a glance

```mermaid
flowchart TD
    A[Human / Telegram / Demo CLI] --> B[WerewolfEngine]
    B --> C[AI Players + Judge Adapter]
    C --> D[ComputeAdapter]
    D --> D1[0G Compute backend]
    D --> D2[LLM fallback / mock backend]
    B --> E[Artifact Pipeline]
    E --> E1[Raw transcript]
    E --> E2[Public replay transcript]
    E --> E3[Private audit transcript]
    E --> E4[Summary]
    E --> F[StorageAdapter]
    F --> G[0G Storage]
    E1 --> H[GameRegistry.sol]
    E4 --> H
    H --> I[0G Galileo]
    G --> J[Replay Verification Dashboard]
    I --> J
    J --> K[Judge / Reviewer verification]
```

More detail:
- `docs/ARCHITECTURE.md`
- `docs/ARCHITECTURE_DIAGRAM.md`
- `docs/CONTRACTS.md`
- `docs/0G_STORAGE.md`

## Repository layout

```text
contracts/   Solidity contracts
src/         game engine, adapters, storage/chain integrations
scripts/     deploy / verify / index / serve helpers
web/         replay verification dashboard
docs/        submission and architecture materials
artifacts/   local generated demo artifacts (gitignored)
```

## Quick start

### 1. Install

```bash
npm install
```

### 2. Typecheck

```bash
npm run check
```

### 3. Run local demo

```bash
npm run demo
```

### 4. Refresh replay browser index

```bash
npm run refresh:game-index
```

### 5. Serve dashboard locally

```bash
npm run web:serve
```

Then open the local dashboard URL shown by the script.

## Useful commands

### Local demo

```bash
npm run demo
```

### LLM-backed demo

```bash
npm run demo:llm
```

### 0G storage demo run

```bash
npm run demo:0g
```

### Verify a recorded game

```bash
npm run verify:game -- --gameId demo-1778392688003
```

### Compile contracts

```bash
npm run contracts:compile
```

### Deploy GameRegistry to 0G Galileo

```bash
npm run deploy:registry:0g
```


## 0G Compute speech mode

For live demos that need more varied agent language without making every game action depend on many model calls, use:

```bash
COMPUTE_BACKEND=0g-speech npm run demo:llm
```

This mode sends public speeches to the configured 0G Compute/OpenAI-compatible endpoint and keeps vote, kill, and seer choices on deterministic adapter logic. That gives the agents more personality while preserving predictable demo flow. For 0G Direct providers, keep `LLM_MIN_REQUEST_INTERVAL_MS` high enough for provider rate limits.

## Security before publishing

Before any GitHub push, release, public zip, gist, or other external sync, run a strict review. Do **not** publish `.env`, `secrets/`, private keys, API keys, bearer tokens, cookies, local credential paths, raw Authorization headers, or unredacted logs/screenshots. Public keys, wallet addresses, contract addresses, endpoints, and tx hashes may still reveal project relationships; confirm with the project owner before publishing them.

## What judges see

### Dashboard overview

![Dashboard browser view](docs/assets/dashboard-browser-annotated.png)

### Verification view

![Dashboard verification view](docs/assets/dashboard-verification-annotated.png)

## Verification model

The project intentionally separates artifacts by audience:

- **raw transcript** → full internal record used for chain anchoring / audit
- **public replay transcript** → safe for judges and live demos
- **private audit transcript** → preserves hidden-role / night information
- **summary** → final result and structured outcome metadata

Important detail:

> The root recorded onchain corresponds to the **raw transcript / summary path**, not the judge-safe public replay transcript.

That separation is deliberate and is part of the product design.

## Product direction beyond Werewolf

Future game surfaces can include:

- Who Is Undercover / 谁是卧底
- Avalon
- Mafia
- The Resistance
- Script murder / 剧本杀
- Sea turtle soup / 海龟汤
- AI debate and DAO governance simulations
- tournament ladders and reputation-weighted matchmaking

## Current status

What is already real today:

- live 0G Galileo registry deployment
- real uploaded match artifacts on 0G Storage
- working verification dashboard
- multi-match replay browser
- contract verification script
- 0G Compute Direct integration for richer agent speech
- 0G-native layered agent memory artifacts and dashboard roots

What is intentionally left limited in the MVP:

- wager settlement is architecture-ready but not central to submission
- Telegram gameplay wrapper is MVP-level
- live 0G Compute is currently used for speech enrichment; vote / night decisions stay deterministic in demo mode to control cost, rate limits, and live-game stability

## Docs for judges / reviewers

- `docs/SUBMISSION.md`
- `docs/SUBMISSION_FINAL_ANSWERS.md`
- `docs/DEMO_SCRIPT.md`
- `docs/SCREENSHOT_CHECKLIST.md`
- `docs/TASKS.md`

## License

MIT
