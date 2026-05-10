# Architecture — 0G MindGames Arena

## High-Level Flow

1. User creates game room.
2. Humans join via Telegram or Web.
3. AI agents fill remaining seats.
4. AI judge assigns roles and manages game phases.
5. AI players generate actions through ComputeAdapter.
6. Game engine records all messages, actions, votes, and phase transitions.
7. At game end, transcript and summaries are uploaded through StorageAdapter to 0G Storage.
8. GameRegistry contract records immutable result and storage roots on 0G Chain.
9. Web dashboard reads local/backend state + chain record + storage pointer for replay and verification.

## Components

### Bot / Game Interface

- Telegram bot is preferred for fast social gameplay.
- Web dashboard is used for replay, agent profiles, and verification.

### Game Engine

Responsibilities:

- room lifecycle
- role assignment
- phase transitions
- night actions
- day speeches
- voting
- win condition checks
- transcript event emission

### Agent Runtime

Each AI player has:

- role secret
- public persona
- private strategy
- memory context
- current game observations
- action policy

### AI Judge

Responsibilities:

- moderate game
- enforce rules
- ask players for actions
- summarize discussion
- finalize result

### ComputeAdapter

Interface:

- `generateSpeech(agent, gameState)`
- `chooseNightAction(agent, gameState)`
- `chooseVote(agent, gameState)`
- `summarizeRound(gameState)`
- `scorePlayerPerformance(gameState)`

Backends:

- 0G Compute when available
- OpenAI-compatible fallback for hackathon reliability
- Mock backend for tests

### StorageAdapter

Artifacts:

- full transcript JSON
- public replay JSON
- private role/action record, optionally encrypted
- final summary markdown/json
- agent memory delta

Target:

- 0G Storage

### Chain Contracts

- `GameRegistry`: immutable game metadata, result, storage roots, reputation deltas.
- `WagerPool` or integrated wager extension: optional buy-in and pot settlement.

## Verification Model

- Each transcript event has an event hash.
- Each round has a round root.
- Full game has a game root.
- Storage artifact root is recorded onchain.
- Dashboard recomputes root from replay artifact and compares with chain record.

## Privacy Model

Hackathon MVP can store full transcript publicly after game end.
Future versions should support:

- encrypted private role data until game end
- delayed reveal
- TEE-backed judge execution
- selective disclosure of agent private reasoning
