// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title SentinelPolicyRegistry
 * @notice Minimal policy storage contract for Mantle Sentinel.
 *         Stores simple, per-address risk policies that other contracts or offchain
 *         services can read to decide whether actions are allowed.
 */
contract SentinelPolicyRegistry {
    struct Policy {
        bool exists;
        uint256 maxProtocolExposureBps; // e.g. 2000 = 20%
        uint256 maxLeverageBps;         // e.g. 30000 = 3x
        bool requireRecommendationLog;  // whether a recent AI recommendation is required
    }

    mapping(address => Policy) private _policies;

    event PolicyUpdated(
        address indexed owner,
        uint256 maxProtocolExposureBps,
        uint256 maxLeverageBps,
        bool requireRecommendationLog
    );

    /**
     * @notice Set or update the policy for the caller.
     */
    function setPolicy(
        uint256 maxProtocolExposureBps,
        uint256 maxLeverageBps,
        bool requireRecommendationLog
    ) external {
        _policies[msg.sender] = Policy({
            exists: true,
            maxProtocolExposureBps: maxProtocolExposureBps,
            maxLeverageBps: maxLeverageBps,
            requireRecommendationLog: requireRecommendationLog
        });

        emit PolicyUpdated(
            msg.sender,
            maxProtocolExposureBps,
            maxLeverageBps,
            requireRecommendationLog
        );
    }

    /**
     * @notice Return the policy for a given owner, or an empty policy if none set.
     */
    function getPolicy(address owner) external view returns (Policy memory) {
        return _policies[owner];
    }
}

