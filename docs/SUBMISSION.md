# 0G APAC Hackathon Submission Draft

## Project

**0G MindGames Arena**

## One-line Pitch

A verifiable social reasoning arena where humans and AI agents play deduction games, with match artifacts stored on 0G and outcomes anchored on 0G Chain.

## Problem

Most AI agent demos focus on chat, tool use, or trading. They rarely test the harder parts of intelligence that show up in real multi-agent environments:

- trust calibration
- deception resistance
- persuasion
- coordination under uncertainty
- replayable social reasoning

That leaves a gap between “an agent can answer questions” and “an agent can survive complex social interaction.”

## Solution

0G MindGames Arena turns social deduction games into a benchmark and entertainment layer for autonomous agents.

In the current MVP, a human and multiple AI agents play **Werewolf**. The system produces:

- a raw full transcript
- a judge-safe public replay transcript
- a private hidden-role audit transcript
- a structured final summary
- a GameRegistry record on 0G Galileo
- 0G Compute-powered public dialogue for more natural, personality-rich AI agents

This makes the match **replayable, inspectable, and verifiable** instead of a black-box AI demo.

## Why 0G

### 0G Storage
Stores transcripts, summaries, audit trails, and future agent memory artifacts as durable records.

### 0G Chain
Anchors outcome, storage roots, reputation deltas, and future tournament / settlement logic.

### 0G Compute
Provides the pluggable reasoning layer for AI judges and players. In the current demo, 0G Compute Direct powers agent public speeches through `qwen/qwen-2.5-7b-instruct`, making table talk less templated while deterministic action selection keeps demo games reliable.

### 0G verification path
Enables judges to compare uploaded artifacts and contract records instead of trusting a demo video at face value.

## What Works Today

- human + AI Werewolf MVP
- personality-rich AI players
- public replay transcript / private audit transcript separation
- 0G Storage upload flow for replay, audit, and summary artifacts
- GameRegistry write path on 0G Galileo
- multi-match replay browser
- contract verification script
- 0G Compute Direct speech integration with rate-limit protection
- layered 0G agent memory artifacts: current-game evidence, cross-game memory, and manifest roots

## Demo Flow

1. Start a game
2. Run the social reasoning loop between human + AI players
3. Generate replay, audit, and summary artifacts
4. Upload artifacts to 0G Storage
5. Record outcome and roots in GameRegistry on 0G Galileo
6. Open the verification dashboard
7. Verify that artifacts and onchain record match the claimed game

## Differentiators

- social reasoning benchmark instead of generic chat demo
- multiple AI agents with distinct personalities and incentives
- public replay separated from private audit trail
- verifiable match history rather than unverifiable “AI said this” output
- strong expansion path to tournaments, agent reputation, and richer reasoning games
- hybrid compute design: live 0G LLM speech + deterministic action control for stable public demos

## Proof Points

- **Demo video:** https://github.com/mikelsl/0g-hackthon/raw/main/docs/assets/0g-mindgames-demo-v8-side-by-side-seer-with-links-2026-05-11.mp4
- **Live dashboard:** https://openclaw.yuzu-swap.com/dashboard/0g/
- **GitHub repo:** https://github.com/mikelsl/0g-hackthon
- **0G Mainnet GameRegistry:** `0x5677F20bD56538F20051Fe8Bf002e6D06780d85c`
- **0G Mainnet contract link:** https://chainscan.0g.ai/address/0x5677F20bD56538F20051Fe8Bf002e6D06780d85c
- **0G Mainnet finalized proof tx:** https://chainscan.0g.ai/tx/0x92b37e58678b0e52c7edc805e47fb7f380962c83536fa541f4a85690a0210851
- **Verified live Telegram game:** `tg-1778501266590`
- **Proof roots recorded on mainnet:** transcript `0x1ee71738378263a4644a0cc7cecfba981d6fa0f834b7d9074d519acdcc116bb8`, summary `0x8218f7b2c8d4bbade286171a96804ebff2e30402b044eec88c7ade90e2115409`

Mainnet verification command:

```bash
npm run verify:game -- --gameId tg-1778501266590 --manifest artifacts/tg-1778501266590/replay-manifest.json --deployment deployments/0g-mainnet.GameRegistry.json --rpc https://evmrpc.0g.ai --address 0x5677F20bD56538F20051Fe8Bf002e6D06780d85c
```

## Why This Matters Beyond Games

Werewolf is the first interface, not the whole product.

The bigger direction is a **social intelligence layer for autonomous agents**:

- benchmark environments for multi-agent reasoning
- persistent onchain reputation based on behavior under uncertainty
- replayable datasets for agent training and evaluation
- tournament or DAO governance scenarios where social reasoning matters

## Scope Decision for Submission

Wager settlement is intentionally **not** the center of this submission.

Current recommendation:

- keep wager / settlement as architecture-ready future scope
- keep the submission focused on verifiable AI social reasoning + 0G Storage / Chain integration

## Assets Included

- architecture and product docs in `docs/`
- GitHub-renderable architecture diagram: `docs/ARCHITECTURE_DIAGRAM.md`
- annotated dashboard screenshots in `docs/assets/`
- live replay verification dashboard
- deployed 0G mainnet contract and finalized mainnet proof tx
- example verified live Telegram game
- public GitHub repository

## Publication Safety

Before updating the public repository or submitting any external package, run a strict secret/public-info review. Exclude private keys, API keys, `.env`, `secrets/`, bearer tokens, local credential paths, raw logs, and screenshots containing credentials. Public keys, wallet addresses, contract addresses, endpoints, and tx hashes should be confirmed before publication because they can still reveal project relationships.
