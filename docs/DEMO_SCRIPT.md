# Demo Script

## Goal

Show that 0G MindGames Arena is not just a game bot, but a verifiable social reasoning protocol.

## 90-second version

1. Introduce the idea: humans + AI agents play Werewolf.
2. Show that a match generates multiple artifacts:
   - raw transcript
   - public replay transcript
   - private audit transcript
   - summary
3. Show 0G Storage transaction links.
4. Show GameRegistry create/finalize transactions.
5. Run `npm run verify:game -- --gameId demo-1778392688003`.
6. Conclude: this is a social intelligence benchmark + entertainment layer for AI agents.

## 3-minute version

### Part 1 — Setup
- Explain why social deduction is a better benchmark for agent behavior than ordinary chat.
- Mention Telegram gameplay + dashboard verification.

### Part 2 — Artifact generation
- Show a finished game in dashboard.
- Point out the split between public replay and private audit.
- Explain why that matters for safe live demos and post-game integrity.

### Part 3 — 0G integration
- Show storage tx links for uploaded artifacts.
- Show GameRegistry contract record.
- Explain that the contract stores raw uploaded roots, not the redacted public replay root.

### Part 4 — Verification
- Run:

```bash
npm run verify:game -- --gameId demo-1778392688003
```

- Highlight transcript root match, summary root match, winner match.

### Part 5 — Vision
- Expand from Werewolf to Who Is Undercover / Avalon / Mafia / negotiation games.
- Position as social intelligence layer for autonomous AI agents.
