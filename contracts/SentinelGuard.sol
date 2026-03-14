// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./SentinelPolicyRegistry.sol";

/**
 * @title SentinelGuard
 * @notice Simple guard contract that checks a caller's policy before allowing
 *         downstream execution. This is a minimal example showing how policies
 *         from SentinelPolicyRegistry could gate sensitive actions.
 */
contract SentinelGuard {
    SentinelPolicyRegistry public immutable policyRegistry;

    error PolicyNotSet();
    error ActionNotAllowed();

    constructor(SentinelPolicyRegistry _policyRegistry) {
        policyRegistry = _policyRegistry;
    }

    /**
     * @notice Example guard function that would be called by a DAO / vault / smart account
     *         before executing a sensitive action.
     * @param owner The address whose policy should be enforced (e.g. DAO treasury)
     * @param resultingProtocolExposureBps Resulting single-protocol exposure after the action (in basis points)
     * @param resultingLeverageBps Resulting leverage after the action (in basis points)
     * @param hasRecentRecommendation Whether an offchain service has recently logged an AI recommendation
     */
    function checkPolicyFor(
        address owner,
        uint256 resultingProtocolExposureBps,
        uint256 resultingLeverageBps,
        bool hasRecentRecommendation
    ) public view {
        SentinelPolicyRegistry.Policy memory p = policyRegistry.getPolicy(owner);
        if (!p.exists) revert PolicyNotSet();

        bool allowed = true;

        if (
            p.maxProtocolExposureBps > 0 &&
            resultingProtocolExposureBps > p.maxProtocolExposureBps
        ) {
            allowed = false;
        }

        if (p.maxLeverageBps > 0 && resultingLeverageBps > p.maxLeverageBps) {
            allowed = false;
        }

        if (p.requireRecommendationLog && !hasRecentRecommendation) {
            allowed = false;
        }

        if (!allowed) revert ActionNotAllowed();
    }
}

