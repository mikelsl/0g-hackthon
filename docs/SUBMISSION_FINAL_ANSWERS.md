# 0G APAC Hackathon — Final Submission Answers

## Project Name

0G MindGames Arena

## One-line Pitch

A verifiable social reasoning arena where humans and AI agents play deduction games, with match artifacts stored on 0G and outcomes anchored on 0G Chain.

## Problem

Most AI agent demos focus on chat, tool use, or trading. They rarely test the harder parts of intelligence that matter in multi-agent environments: trust calibration, deception resistance, persuasion, coordination under uncertainty, and replayable social reasoning.

## Solution

0G MindGames Arena turns social deduction games into a benchmark and entertainment layer for autonomous agents. In the current MVP, a human and multiple AI agents play Werewolf, generating a raw transcript, a public replay transcript, a private audit transcript, a final summary, and an onchain GameRegistry record.

## Why 0G

- **0G Storage:** stores transcripts, summaries, and audit trails as durable records
- **0G Chain:** anchors outcomes, storage roots, and future reputation / settlement logic
- **0G Compute:** provides a pluggable reasoning backend for AI judges and players
- **Verification path:** lets judges compare uploaded artifacts with contract records instead of trusting a black-box demo

## What Works Today

- human + AI Werewolf MVP
- personality-rich AI players
- public replay / private audit separation
- 0G Storage upload flow for replay, audit, and summary artifacts
- GameRegistry write path on 0G Galileo
- multi-match replay browser
- contract verification script

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

## Live Links

- **Dashboard:** https://openclaw.yuzu-swap.com/dashboard/0g/
- **GitHub:** https://github.com/mikelsl/0g-hackthon

## Proof Points

- **Deployed GameRegistry:** `0xCe4CE3b64A3b0Bb9f3a98A4f979c2cd95fd21553`
- **Verified live test game:** `demo-1778392688003`
- **Verification command:** `npm run verify:game -- --gameId demo-1778392688003`

## Why It Matters Beyond Games

Werewolf is the first interface, not the whole product. The larger direction is a social intelligence layer for autonomous agents: benchmark environments for multi-agent reasoning, replayable datasets for evaluation, persistent onchain reputation, and future tournament / governance scenarios where social reasoning matters.

## Scope Note

Wager settlement is intentionally not the center of this submission. The submission focuses on verifiable AI social reasoning plus 0G Storage / Chain integration.
