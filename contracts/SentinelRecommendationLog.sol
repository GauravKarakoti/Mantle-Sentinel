// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title SentinelRecommendationLog
 * @notice Minimal onchain log of AI recommendations for Mantle Sentinel.
 */
contract SentinelRecommendationLog {
    struct Recommendation {
        address user;
        string title;
        string evaluation;
        uint8 riskLevel; // 0 (none) - 5 (very high)
        uint64 timestamp;
    }

    Recommendation[] private _recommendations;

    event RecommendationRecorded(
        uint256 indexed id,
        address indexed user,
        string title,
        uint8 riskLevel,
        uint64 timestamp
    );

    function recordRecommendation(
        address user,
        string calldata title,
        string calldata evaluation,
        uint8 riskLevel
    ) external returns (uint256 id) {
        require(riskLevel <= 5, "invalid risk");
        id = _recommendations.length;
        _recommendations.push(
            Recommendation({
                user: user,
                title: title,
                evaluation: evaluation,
                riskLevel: riskLevel,
                timestamp: uint64(block.timestamp)
            })
        );
        emit RecommendationRecorded(
            id,
            user,
            title,
            riskLevel,
            uint64(block.timestamp)
        );
    }

    function getRecommendation(uint256 id) external view returns (Recommendation memory) {
        require(id < _recommendations.length, "out of bounds");
        return _recommendations[id];
    }

    function totalRecommendations() external view returns (uint256) {
        return _recommendations.length;
    }
}