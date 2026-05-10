# 0G APAC Hackathon Submission Skeleton

## One-line Pitch

0G MindGames Arena is a verifiable social reasoning arena where humans and AI agents play deduction games, with transcripts on 0G Storage and outcomes/reputation anchored on 0G Chain.

## Problem

Current AI agent demos mostly show tool use, trading, or assistants. They rarely test social reasoning, deception, trust calibration, or multi-agent interaction in a way that is replayable and verifiable.

## Solution

We turn social deduction games into a benchmark + entertainment surface:

- humans and AI play together
- every match generates replayable artifacts
- public replay and private audit trails are separated
- final results and storage roots are anchored onchain

## Why 0G

- **0G Storage**: durable transcript / summary / audit artifact storage
- **0G Chain**: immutable game results, roots, reputation, future settlement
- **0G Compute**: pluggable AI reasoning backend for judges and players
- **0G verification path**: replay root + contract root comparison

## Demo Scope

### What works now

- human + AI Werewolf MVP
- Telegram gameplay wrapper
- public replay transcript + private audit transcript split
- 0G Storage upload for raw/public/private/summary artifacts
- GameRegistry recording on 0G Galileo
- contract verification via `npm run verify:game`

### What is shown in demo

1. start a match
2. generate transcript and summary artifacts
3. upload to 0G
4. finalize to GameRegistry
5. open verification dashboard
6. compare replay artifacts with chain record

## Differentiators

- social reasoning instead of generic chat agent demo
- multiple personality-rich AI players
- public replay vs private audit separation
- verifiable match history instead of black-box output
- future expansion path to other reasoning games and wager-backed tournaments

## Current Proof Points

- Deployed GameRegistry: `0xCe4CE3b64A3b0Bb9f3a98A4f979c2cd95fd21553`
- Verified live test game: `demo-1778392688003`
- Verification command:

```bash
npm run verify:game -- --gameId demo-1778392688003
```

## Submission Assets Needed

- architecture diagram
- 2-3 annotated dashboard screenshots
- short demo video
- concise GitHub README
- optional product roadmap slide

## Open Product Decision

Keep wager settlement as:

- **Option A:** stubbed architecture only
- **Option B:** limited demo on testnet

Recommendation: decide after submission materials are stable.
