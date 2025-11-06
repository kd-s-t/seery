// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title PredictionMarket
 * @dev A simple prediction market contract for BNB Chain
 * Allows users to create markets, place bets, and resolve outcomes
 */
contract PredictionMarket {
    struct Market {
        uint256 id;
        address creator;
        string question;
        string[] outcomes;
        uint256 endTime;
        bool resolved;
        uint256 winningOutcome;
        uint256 totalPool;
        mapping(uint256 => uint256) outcomePools;
        mapping(address => mapping(uint256 => uint256)) bets;
    }

    uint256 public marketCount;
    mapping(uint256 => Market) public markets;
    mapping(address => uint256) public balances;
    
    uint256 public constant PLATFORM_FEE = 2; // 2% platform fee
    uint256 public constant MIN_BET = 0.001 ether; // Minimum bet amount
    
    event MarketCreated(uint256 indexed marketId, address indexed creator, string question);
    event BetPlaced(uint256 indexed marketId, address indexed better, uint256 outcome, uint256 amount);
    event MarketResolved(uint256 indexed marketId, uint256 winningOutcome);
    event Withdrawal(address indexed user, uint256 amount);

    /**
     * @dev Create a new prediction market
     */
    function createMarket(
        string memory question,
        string[] memory outcomes,
        uint256 durationHours
    ) external returns (uint256) {
        require(outcomes.length >= 2, "Must have at least 2 outcomes");
        require(durationHours > 0 && durationHours <= 168, "Duration must be 1-168 hours");
        
        marketCount++;
        uint256 marketId = marketCount;
        Market storage market = markets[marketId];
        
        market.id = marketId;
        market.creator = msg.sender;
        market.question = question;
        market.outcomes = outcomes;
        market.endTime = block.timestamp + (durationHours * 1 hours);
        market.resolved = false;
        
        emit MarketCreated(marketId, msg.sender, question);
        return marketId;
    }

    /**
     * @dev Place a bet on a market outcome
     */
    function placeBet(uint256 marketId, uint256 outcome) external payable {
        Market storage market = markets[marketId];
        require(market.id != 0, "Market does not exist");
        require(!market.resolved, "Market already resolved");
        require(block.timestamp < market.endTime, "Market has ended");
        require(outcome < market.outcomes.length, "Invalid outcome");
        require(msg.value >= MIN_BET, "Bet too small");
        
        market.bets[msg.sender][outcome] += msg.value;
        market.outcomePools[outcome] += msg.value;
        market.totalPool += msg.value;
        
        emit BetPlaced(marketId, msg.sender, outcome, msg.value);
    }

    /**
     * @dev Resolve a market (only creator or after end time)
     */
    function resolveMarket(uint256 marketId, uint256 winningOutcome) external {
        Market storage market = markets[marketId];
        require(market.id != 0, "Market does not exist");
        require(!market.resolved, "Market already resolved");
        require(
            msg.sender == market.creator || block.timestamp >= market.endTime,
            "Not authorized or too early"
        );
        require(winningOutcome < market.outcomes.length, "Invalid outcome");
        
        market.resolved = true;
        market.winningOutcome = winningOutcome;
        
        emit MarketResolved(marketId, winningOutcome);
    }

    /**
     * @dev Claim winnings from a resolved market
     */
    function claimWinnings(uint256 marketId) external {
        Market storage market = markets[marketId];
        require(market.resolved, "Market not resolved");
        
        uint256 betAmount = market.bets[msg.sender][market.winningOutcome];
        require(betAmount > 0, "No winning bets");
        
        // Calculate share of pool
        uint256 totalWinningPool = market.outcomePools[market.winningOutcome];
        uint256 userShare = (market.totalPool * betAmount) / totalWinningPool;
        
        // Deduct platform fee
        uint256 fee = (userShare * PLATFORM_FEE) / 100;
        uint256 payout = userShare - fee;
        
        // Clear user's bet
        market.bets[msg.sender][market.winningOutcome] = 0;
        
        balances[msg.sender] += payout;
        balances[address(this)] += fee;
    }

    /**
     * @dev Withdraw accumulated balance
     */
    function withdraw() external {
        uint256 amount = balances[msg.sender];
        require(amount > 0, "No balance to withdraw");
        
        balances[msg.sender] = 0;
        payable(msg.sender).transfer(amount);
        
        emit Withdrawal(msg.sender, amount);
    }

    /**
     * @dev Get market details
     */
    function getMarket(uint256 marketId) external view returns (
        address creator,
        string memory question,
        uint256 endTime,
        bool resolved,
        uint256 winningOutcome,
        uint256 totalPool
    ) {
        Market storage market = markets[marketId];
        require(market.id != 0, "Market does not exist");
        
        return (
            market.creator,
            market.question,
            market.endTime,
            market.resolved,
            market.winningOutcome,
            market.totalPool
        );
    }

    /**
     * @dev Get outcome pool size
     */
    function getOutcomePool(uint256 marketId, uint256 outcome) external view returns (uint256) {
        return markets[marketId].outcomePools[outcome];
    }

    /**
     * @dev Get user's bet on a market
     */
    function getUserBet(uint256 marketId, address user, uint256 outcome) external view returns (uint256) {
        return markets[marketId].bets[user][outcome];
    }

    /**
     * @dev Get market outcomes
     */
    function getMarketOutcomes(uint256 marketId) external view returns (string[] memory) {
        Market storage market = markets[marketId];
        require(market.id != 0, "Market does not exist");
        return market.outcomes;
    }
}

