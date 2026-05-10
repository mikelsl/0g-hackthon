# Telegram Bot Gameplay Wrapper

This is the first interactive human gameplay wrapper around `WerewolfEngine`.

## Run

```bash
cp .env.example .env
# edit TELEGRAM_BOT_TOKEN
npm run bot:telegram
```

Human actions use timeout fallback so live games do not hang forever. Configure with `HUMAN_ACTION_TIMEOUT_MS` in milliseconds.

By default, AI players use `MockComputeAdapter`:

```bash
USE_LLM=0 npm run bot:telegram
```

For real LLM agents:

```bash
USE_LLM=1 npm run bot:telegram
```

Required when `USE_LLM=1`:

- `LLM_BASE_URL`
- `LLM_API_KEY`
- `LLM_MODEL`

## Commands

- `/newgame` — create a room
- `/join` — join as a human player
- `/startgame` — start game with humans + AI agents, up to 6 players
- `/say <message>` — submit public speech when asked
- `/vote <playerId>` — submit vote when asked; inline buttons are also shown
- `/kill <playerId>` — submit wolf night kill when asked; inline buttons are also shown
- `/check <playerId>` — submit seer inspection when asked; inline buttons are also shown
- `/status` — show current room state and pending human actions

## Current MVP Behavior

- Minimum 1 human joins.
- AI agents fill remaining seats to 6 players.
- Roles are randomly assigned.
- Human role notices are sent by private DM when the user has started the bot privately; otherwise the bot asks the user to DM `/start`.
- Human wolf night kill and seer check actions are now supported through `/kill` and `/check`.
- Bot periodically reminds pending human speech/vote/night-action requests and shows remaining timeout.
- Vote, kill, and seer-check prompts include inline buttons so players do not need to type player IDs.
- If a human does not respond before `HUMAN_ACTION_TIMEOUT_MS`, the engine auto-submits a safe fallback action and marks the transcript event with `timeoutFallback: true`.
- Game writes raw transcript, public replay transcript, private audit transcript, summary artifacts, and replay manifest automatically.
- If `CHAIN_BACKEND=0g`, Telegram games can finalize directly into the deployed 0G GameRegistry.

## Next Telegram Iteration

- Multi-human private wolf chat coordination.
- Better replay/game list browsing from Telegram messages.
- Optional auto-publish latest replay manifest to the dashboard entry.
