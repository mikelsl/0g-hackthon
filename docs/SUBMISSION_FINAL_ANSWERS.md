# 0G APAC Hackathon — Final Submission Answers

## Project Name

0G MindGames Arena

## One-line Pitch

A verifiable social reasoning arena where humans and AI agents play deduction games, with match artifacts stored on 0G and outcomes anchored on 0G Chain.

## Problem

Most AI agent demos focus on chat, tool use, or trading. They rarely test the harder parts of intelligence that matter in multi-agent environments: trust calibration, deception resistance, persuasion, coordination under uncertainty, and replayable social reasoning.

## Solution

0G MindGames Arena turns social deduction games into a benchmark and entertainment layer for autonomous agents. In the current MVP, a human and multiple AI agents play Werewolf, generating a raw transcript, a public replay transcript, a private audit transcript, layered agent-memory artifacts, a final summary, and an onchain GameRegistry record. Public AI dialogue can be generated through 0G Compute Direct for richer, less repetitive table talk.

## Why 0G

- **0G Storage:** stores transcripts, summaries, and audit trails as durable records
- **0G Chain:** anchors outcomes, storage roots, and future reputation / settlement logic
- **0G Compute:** provides a pluggable reasoning backend for AI judges and players; current demo uses 0G Direct + Qwen 2.5 7B for public speeches
- **Verification path:** lets judges compare uploaded artifacts with contract records instead of trusting a black-box demo

## What Works Today

- human + AI Werewolf MVP
- personality-rich AI players
- public replay / private audit separation
- 0G Storage upload flow for replay, audit, and summary artifacts
- GameRegistry write path on 0G Galileo
- multi-match replay browser
- contract verification script
- 0G Compute Direct speech enrichment with provider rate-limit protection
- layered current-game / cross-game agent memory artifacts on 0G Storage

## Demo Flow

1. Start a game
2. Run the human + AI social reasoning loop
3. Generate replay, audit, and summary artifacts
4. Upload artifacts to 0G Storage
5. Record outcome and roots in GameRegistry on 0G Galileo
6. Open the verification dashboard
7. Verify that artifacts and onchain record match the claimed game

## Differentiators

- social reasoning benchmark instead of generic chat demo
- multiple AI agents with distinct personalities and incentives
- public replay separated from private audit trail
- verifiable match history instead of unverifiable AI output
- strong expansion path to tournaments, reputation, and richer reasoning games
- hybrid compute mode: 0G LLM speech for personality, deterministic decisions for stable demos

## Live Links

- **Dashboard:** https://openclaw.yuzu-swap.com/dashboard/0g/
- **GitHub:** https://github.com/mikelsl/0g-hackthon

## Proof Points

- **0G Mainnet GameRegistry:** `0x5677F20bD56538F20051Fe8Bf002e6D06780d85c`
- **0G Mainnet contract link:** https://chainscan.0g.ai/address/0x5677F20bD56538F20051Fe8Bf002e6D06780d85c
- **0G Mainnet finalized proof tx:** https://chainscan.0g.ai/tx/0x92b37e58678b0e52c7edc805e47fb7f380962c83536fa541f4a85690a0210851
- **Verified live Telegram game:** `tg-1778501266590`
- **Mainnet proof roots:** transcript `0x1ee71738378263a4644a0cc7cecfba981d6fa0f834b7d9074d519acdcc116bb8`, summary `0x8218f7b2c8d4bbade286171a96804ebff2e30402b044eec88c7ade90e2115409`
- **Mainnet verification command:** `npm run verify:game -- --gameId tg-1778501266590 --manifest artifacts/tg-1778501266590/replay-manifest.json --deployment deployments/0g-mainnet.GameRegistry.json --rpc https://evmrpc.0g.ai --address 0x5677F20bD56538F20051Fe8Bf002e6D06780d85c`

## Why It Matters Beyond Games

Werewolf is the first interface, not the whole product. The larger direction is a social intelligence layer for autonomous agents: benchmark environments for multi-agent reasoning, replayable datasets for evaluation, persistent onchain reputation, and future tournament / governance scenarios where social reasoning matters.

## Scope Note

Wager settlement is intentionally not the center of this submission. The submission focuses on verifiable AI social reasoning plus 0G Storage / Chain integration.


## Publication Safety

Before any public repo update or external submission package, run a strict secret review. Do not publish private keys, API keys, `.env`, `secrets/`, bearer tokens, local credential paths, or unredacted logs/screenshots. Confirm public keys, wallet addresses, contract addresses, endpoints, and tx hashes before publication.
