// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract GameRegistry {
    enum WinnerCamp { Unknown, Wolves, Villagers }

    struct GameRecord {
        address creator;
        WinnerCamp winner;
        bytes32 transcriptRoot;
        bytes32 summaryRoot;
        bytes32 reputationRoot;
        uint64 startedAt;
        uint64 finishedAt;
        bool finalized;
    }

    mapping(bytes32 => GameRecord) public games;

    event GameCreated(bytes32 indexed gameId, address indexed creator, uint64 startedAt);
    event GameFinalized(
        bytes32 indexed gameId,
        WinnerCamp winner,
        bytes32 transcriptRoot,
        bytes32 summaryRoot,
        bytes32 reputationRoot,
        uint64 finishedAt
    );

    function createGame(bytes32 gameId) external {
        require(games[gameId].creator == address(0), "GAME_EXISTS");
        games[gameId].creator = msg.sender;
        games[gameId].startedAt = uint64(block.timestamp);
        emit GameCreated(gameId, msg.sender, uint64(block.timestamp));
    }

    function finalizeGame(
        bytes32 gameId,
        WinnerCamp winner,
        bytes32 transcriptRoot,
        bytes32 summaryRoot,
        bytes32 reputationRoot
    ) external {
        GameRecord storage game = games[gameId];
        require(game.creator != address(0), "GAME_NOT_FOUND");
        require(msg.sender == game.creator, "ONLY_CREATOR");
        require(!game.finalized, "ALREADY_FINALIZED");
        require(winner != WinnerCamp.Unknown, "INVALID_WINNER");

        game.winner = winner;
        game.transcriptRoot = transcriptRoot;
        game.summaryRoot = summaryRoot;
        game.reputationRoot = reputationRoot;
        game.finishedAt = uint64(block.timestamp);
        game.finalized = true;

        emit GameFinalized(gameId, winner, transcriptRoot, summaryRoot, reputationRoot, uint64(block.timestamp));
    }
}
