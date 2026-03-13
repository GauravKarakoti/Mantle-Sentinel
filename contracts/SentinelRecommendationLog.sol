// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title SentinelRecommendationLog
 * @notice Minimal onchain log of AI recommendations for Mantle Sentinel.
 *         Offchain AI services can submit hashed inputs and summaries to create
 *         an auditable trail tied to user addresses.
 */
contract SentinelRecommendationLog {
    struct Recommendation {
        address user;
        bytes32 inputHash;
        bytes32 summaryHash;
        uint8 riskLevel; // 0 (none) - 5 (very high)
        uint64 timestamp;
    }

    Recommendation[] private _recommendations;

    event RecommendationRecorded(
        uint256 indexed id,
        address indexed user,
        bytes32 inputHash,
        bytes32 summaryHash,
        uint8 riskLevel,
        uint64 timestamp
    );

    /**
     * @notice Record a new recommendation for a user.
     * @dev Authentication / access control for the AI submitter is intentionally
     *      left simple for now and can be extended later (e.g. with an allowlist).
     */
    function recordRecommendation(
        address user,
        bytes32 inputHash,
        bytes32 summaryHash,
        uint8 riskLevel
    ) external returns (uint256 id) {
        require(riskLevel <= 5, "invalid risk");

        id = _recommendations.length;
        _recommendations.push(
            Recommendation({
                user: user,
                inputHash: inputHash,
                summaryHash: summaryHash,
                riskLevel: riskLevel,
                timestamp: uint64(block.timestamp)
            })
        );

        emit RecommendationRecorded(
            id,
            user,
            inputHash,
            summaryHash,
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

