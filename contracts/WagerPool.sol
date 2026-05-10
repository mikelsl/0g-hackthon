// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice Stretch-goal skeleton for testnet tournament settlement.
/// Avoid casino framing; this is designed as transparent skill-game pot settlement.
contract WagerPool {
    enum WinnerCamp { Unknown, Wolves, Villagers }

    struct Pool {
        uint256 buyIn;
        uint256 totalPot;
        WinnerCamp winner;
        bool finalized;
        address[] wolves;
        address[] villagers;
        mapping(address => bool) joined;
        mapping(address => bool) claimed;
    }

    mapping(bytes32 => Pool) private pools;

    event PoolCreated(bytes32 indexed gameId, uint256 buyIn);
    event Joined(bytes32 indexed gameId, address indexed player, WinnerCamp camp);
    event Finalized(bytes32 indexed gameId, WinnerCamp winner, uint256 totalPot);
    event Claimed(bytes32 indexed gameId, address indexed player, uint256 amount);

    function createPool(bytes32 gameId, uint256 buyIn) external {
        require(pools[gameId].buyIn == 0, "POOL_EXISTS");
        require(buyIn > 0, "BUY_IN_ZERO");
        pools[gameId].buyIn = buyIn;
        emit PoolCreated(gameId, buyIn);
    }

    function join(bytes32 gameId, WinnerCamp camp) external payable {
        Pool storage pool = pools[gameId];
        require(pool.buyIn > 0, "POOL_NOT_FOUND");
        require(!pool.finalized, "FINALIZED");
        require(!pool.joined[msg.sender], "ALREADY_JOINED");
        require(msg.value == pool.buyIn, "BAD_BUY_IN");
        require(camp == WinnerCamp.Wolves || camp == WinnerCamp.Villagers, "BAD_CAMP");

        pool.joined[msg.sender] = true;
        pool.totalPot += msg.value;
        if (camp == WinnerCamp.Wolves) pool.wolves.push(msg.sender);
        else pool.villagers.push(msg.sender);
        emit Joined(gameId, msg.sender, camp);
    }

    function finalize(bytes32 gameId, WinnerCamp winner) external {
        Pool storage pool = pools[gameId];
        require(pool.buyIn > 0, "POOL_NOT_FOUND");
        require(!pool.finalized, "FINALIZED");
        require(winner == WinnerCamp.Wolves || winner == WinnerCamp.Villagers, "BAD_WINNER");
        pool.winner = winner;
        pool.finalized = true;
        emit Finalized(gameId, winner, pool.totalPot);
    }

    function claim(bytes32 gameId) external {
        Pool storage pool = pools[gameId];
        require(pool.finalized, "NOT_FINALIZED");
        require(pool.joined[msg.sender], "NOT_PLAYER");
        require(!pool.claimed[msg.sender], "CLAIMED");

        address[] storage winners = pool.winner == WinnerCamp.Wolves ? pool.wolves : pool.villagers;
        bool isWinner = false;
        for (uint256 i = 0; i < winners.length; i++) {
            if (winners[i] == msg.sender) {
                isWinner = true;
                break;
            }
        }
        require(isWinner, "NOT_WINNER");
        uint256 amount = pool.totalPot / winners.length;
        pool.claimed[msg.sender] = true;
        (bool ok, ) = msg.sender.call{value: amount}("");
        require(ok, "TRANSFER_FAILED");
        emit Claimed(gameId, msg.sender, amount);
    }
}
