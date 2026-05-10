# Contract Design — 0G MindGames Arena

## Contract 1: GameRegistry

Purpose:

- Register completed games.
- Store immutable pointers to 0G Storage artifacts.
- Record participants, result, and reputation deltas.

Core fields:

- `gameId`
- `creator`
- `players`
- `agentIds`
- `winnerCamp`
- `transcriptRoot`
- `summaryRoot`
- `reputationRoot`
- `startedAt`
- `finishedAt`

Core methods:

- `createGame(bytes32 gameId, address[] players, bytes32[] agentIds)`
- `finalizeGame(bytes32 gameId, uint8 winnerCamp, bytes32 transcriptRoot, bytes32 summaryRoot, bytes32 reputationRoot)`
- `getGame(bytes32 gameId)`

## Contract 2: ReputationRegistry

Optional or merged into GameRegistry for MVP.

Purpose:

- Track player and agent reputation updates.
- Keep full score details offchain, store root/hash onchain.

Core fields:

- `subjectId` — wallet address or agent ID
- `scoreRoot`
- `lastGameId`

## Contract 3: WagerPool

Hackathon stretch / future expansion.

Purpose:

- Each participant pays a buy-in, e.g. 1 0G.
- Pot is locked during the game.
- Winner camp splits the pot.
- Onchain settlement gives users strong motivation to verify transcript and result.

Core flow:

1. `createWageredGame(gameId, buyIn)`
2. players join and deposit buy-in
3. game starts when full
4. game finalizes with winner camp and verified result root
5. winners claim or receive proportional payout

Important caution:

- For hackathon, present as optional testnet/game-token mechanics.
- Avoid casino framing. Position as skill/social game tournament settlement.
- Keep legal/regulatory language conservative.


## 0G Galileo Deployment — GameRegistry

- Contract: `GameRegistry.sol`
- Address: `0xCe4CE3b64A3b0Bb9f3a98A4f979c2cd95fd21553`
- Deploy tx: `0x48817635b26c6067fe61c23669dd25fb7ffd568e18056548ff0c5b3dfa696ef0`
- Deployer: Cornerstone `0xd2Ef5A58d3F8Ba869C2a889afE55397717a8E0F6`
- Deployment artifact: `deployments/0g-galileo.GameRegistry.json`

Compile/deploy:

```bash
npm run contracts:compile
ZEROG_PRIVATE_KEY=... npm run deploy:registry:0g
```

Run full 0G Storage + 0G Chain demo:

```bash
STORAGE_BACKEND=0g CHAIN_BACKEND=0g GAME_REGISTRY_ADDRESS=0xCe4CE3b64A3b0Bb9f3a98A4f979c2cd95fd21553 npm run demo
```

Latest registered game: `demo-1778339541021`

- Game key: `0x4270221b1e477aa05045d88c84348a91c07d0a443d7af8788e8a66aed9dcf43b`
- Create tx: `0xd8dd1f1301831c4243dc9824043711b40952047b07cfc371690aaae4a7a310e9`
- Finalize tx: `0x70e1e11680a870e45b6e8dfb7affed83a7f27f3b4d0c267f09110cfcdd4acbda`
- Transcript root: `0x089bb4d2a367dfc88bfa88f8ee992ea3931855b1b2624e764fd20238c0b1e0e8`
- Summary root: `0xab2cd556c14c3f10dd1eba4a4e2bf07c91e8dbc021f2dd407dda8308d7ba4563`
- Reputation root: `0x6de2e30c3cf4884b29aa4bf212c36930a9147dad842c4ed96d78cbcfc141b6ee`
