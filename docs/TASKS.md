# Development Tasks — 0G MindGames Arena

## Phase 0 — Skeleton

- [x] Create workspace and docs.
- [x] Create package structure.
- [x] Add game engine types.
- [x] Add agent persona config.
- [x] Add compute/storage/chain adapters.
- [x] Add demo runner.

## Phase 1 — Local Playable Werewolf

Goal: run a complete 6-player Werewolf game locally with AI-like stubbed agents.

- [x] Implement role assignment.
- [x] Implement night phase.
- [x] Implement day speech phase.
- [x] Implement voting phase.
- [x] Implement win condition checks.
- [x] Persist structured transcript locally.
- [x] Generate final summary JSON.
- [ ] Add deterministic mock agent decisions for tests.

Acceptance:

```bash
npm run demo
```

should complete one game and write artifacts into `./artifacts/`.

## Phase 2 — Real AI Agents

- [x] Add LLM-backed ComputeAdapter.
- [ ] Support agent private role prompts.
- [x] Support personality-specific speaking styles.
- [x] Support private reasoning notes separated from public speech.
- [ ] Add judge summary prompt.
- [ ] Add post-game performance scoring.

## Phase 3 — Telegram Gameplay

- [x] Add Telegram bot process.
- [x] Commands: `/newgame`, `/join`, `/startgame`, `/speak`, `/vote`.
- [x] Private DM role assignment.
- [x] Group chat public phase messages.
- [x] AI auto-actions when it is their turn.

## Phase 4 — 0G Integration

- [x] Integrate 0G Storage SDK adapter.
- [x] Wire transcript artifact upload through StorageAdapter; real 0G upload requires funded key.
- [x] Wire summary artifact upload through StorageAdapter; real 0G upload requires funded key.
- [ ] Upload agent memory delta.
- [x] Deploy GameRegistry to 0G Galileo testnet.
- [x] Write finalized game record onchain through adapter.
- [x] Verify replay root against contract record.

## Phase 5 — Web Dashboard

- [x] Game list page.
- [x] Replay manifest generation for latest demo/dashboard.
- [x] Replay / verification detail page.
- [ ] Agent profile page.
- [x] Verification panel.
- [ ] Reputation delta visualization.
- [ ] Suspicion/trust timeline.

## Phase 6 — Wager Stretch

- [ ] Implement WagerPool contract.
- [ ] Add buy-in flow using 0G native token on testnet.
- [ ] Add winner camp settlement.
- [ ] Show pot verification in dashboard.

## Hackathon Submission Materials

- [ ] Pitch deck.
- [x] Demo script skeleton.
- [ ] Demo video.
- [ ] GitHub README polish.
- [ ] Architecture diagram.
- [x] 0G usage explanation.
- [x] Contract addresses and example txs.
