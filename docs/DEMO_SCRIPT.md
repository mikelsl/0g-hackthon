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
   - layered agent memory artifacts
3. Show 0G Storage transaction links.
4. Mention 0G Compute Direct powering richer public AI speeches in `0g-speech` mode.
5. Show GameRegistry create/finalize transactions.
6. Run `npm run verify:game -- --gameId demo-1778478870644`.
7. Conclude: this is a social intelligence benchmark + entertainment layer for AI agents.

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
- Explain that 0G Compute Direct can generate more varied public table talk through Qwen 2.5 7B while deterministic actions keep demos stable.
- Show GameRegistry contract record.
- Explain that the contract stores raw uploaded roots, not the redacted public replay root.

### Part 4 — Verification
- Run:

```bash
npm run verify:game -- --gameId demo-1778478870644
```

- Highlight transcript root match, summary root match, winner match.

### Part 5 — Safety note
- Before public repo updates or submission packages, run a strict leak review. Do not publish `.env`, `secrets/`, keys, tokens, local credential paths, or unredacted logs/screenshots. Confirm public addresses/endpoints/tx hashes before publication.

### Part 6 — Vision
- Expand from Werewolf to Who Is Undercover / Avalon / Mafia / negotiation games.
- Position as social intelligence layer for autonomous AI agents.
