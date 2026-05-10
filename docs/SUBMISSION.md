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

This makes the match **replayable, inspectable, and verifiable** instead of a black-box AI demo.

## Why 0G

### 0G Storage
Stores transcripts, summaries, audit trails, and future agent memory artifacts as durable records.

### 0G Chain
Anchors outcome, storage roots, reputation deltas, and future tournament / settlement logic.

### 0G Compute
Provides the pluggable reasoning layer for AI judges and players.

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

## Proof Points

- **Live dashboard:** https://openclaw.yuzu-swap.com/dashboard/0g/
- **GitHub repo:** https://github.com/mikelsl/0g-hackthon
- **Deployed GameRegistry:** `0xCe4CE3b64A3b0Bb9f3a98A4f979c2cd95fd21553`
- **Verified live test game:** `demo-1778392688003`

Verification command:

```bash
npm run verify:game -- --gameId demo-1778392688003
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
- live replay verification dashboard
- deployed testnet contract
- example verified live game
- public GitHub repository
