// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./SentinelPolicyRegistry.sol";
import "./SentinelRecommendationLog.sol";

/**
 * @title SentinelGuard
 * @notice Proxy/vault that holds user funds and enforces policy + AI recommendation
 *         before allowing execution. Users deposit into the guard; when they execute
 *         a trade (or any call), the guard reads limits from SentinelPolicyRegistry
 *         and reverts if breached, and verifies a recent recommendation in
 *         SentinelRecommendationLog when requireRecommendationLog is true.
 */
contract SentinelGuard {
    SentinelPolicyRegistry public immutable policyRegistry;
    SentinelRecommendationLog public immutable recommendationLog;

    /// @dev Maximum age of a recommendation to be considered "recent" (24 hours)
    uint256 public constant MAX_RECOMMENDATION_AGE = 24 hours;

    mapping(address => uint256) public balanceOf;

    event Deposited(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event Executed(
        address indexed owner,
        address indexed target,
        uint256 value,
        bytes data,
        uint256 expectedExposureBps,
        uint256 expectedLeverageBps,
        uint256 recommendationId
    );

    error PolicyNotSet();
    error ActionNotAllowed();
    error InsufficientBalance();
    error InvalidRecommendation();
    error RecommendationTooOld();
    error CallFailed();

    constructor(
        SentinelPolicyRegistry _policyRegistry,
        SentinelRecommendationLog _recommendationLog
    ) {
        policyRegistry = _policyRegistry;
        recommendationLog = _recommendationLog;
    }

    /**
     * @notice Deposit native token (MNT/ETH) into the guard. Balance is credited to msg.sender.
     */
    receive() external payable {
        balanceOf[msg.sender] += msg.value;
        emit Deposited(msg.sender, msg.value);
    }

    /**
     * @notice Withdraw native token from the guard to the caller.
     */
    function withdraw(uint256 amount) external {
        if (balanceOf[msg.sender] < amount) revert InsufficientBalance();
        balanceOf[msg.sender] -= amount;
        (bool ok, ) = msg.sender.call{value: amount}("");
        require(ok, "transfer failed");
        emit Withdrawn(msg.sender, amount);
    }

    /**
     * @notice Execute a call through the guard. The call is only performed if:
     *         1) The caller's policy (in SentinelPolicyRegistry) allows it:
     *            - resultingProtocolExposureBps <= maxProtocolExposureBps
     *            - resultingLeverageBps <= maxLeverageBps
     *         2) If the policy has requireRecommendationLog == true, a recent
     *            recommendation for the caller must exist at recommendationId.
     * @param target Contract to call (e.g. DEX, lending protocol).
     * @param value MNT/ETH to send with the call (deducted from caller's balance in this contract).
     * @param data Calldata for the target contract.
     * @param expectedExposureBps Expected single-protocol exposure after this action (basis points).
     * @param expectedLeverageBps Expected leverage after this action (basis points).
     * @param recommendationId Id of the recommendation in SentinelRecommendationLog to use when requireRecommendationLog is true; pass 0 if not required.
     */
    function execute(
        address target,
        uint256 value,
        bytes calldata data,
        uint256 expectedExposureBps,
        uint256 expectedLeverageBps,
        uint256 recommendationId
    ) external {
        address owner = msg.sender;
        if (balanceOf[owner] < value) revert InsufficientBalance();

        SentinelPolicyRegistry.Policy memory p = policyRegistry.getPolicy(owner);
        if (!p.exists) revert PolicyNotSet();

        bool hasRecentRecommendation;
        if (p.requireRecommendationLog) {
            if (!_isValidRecentRecommendation(owner, recommendationId)) revert InvalidRecommendation();
            hasRecentRecommendation = true;
        } else {
            hasRecentRecommendation = true; // no requirement
        }

        _checkPolicyFor(owner, expectedExposureBps, expectedLeverageBps, hasRecentRecommendation);

        balanceOf[owner] -= value;
        (bool success, ) = target.call{value: value}(data);
        if (!success) revert CallFailed();

        emit Executed(
            owner,
            target,
            value,
            data,
            expectedExposureBps,
            expectedLeverageBps,
            recommendationId
        );
    }

    /**
     * @dev Validates that recommendationId refers to a recommendation for owner that is within MAX_RECOMMENDATION_AGE.
     */
    function _isValidRecentRecommendation(address owner, uint256 recommendationId)
        internal
        view
        returns (bool)
    {
        uint256 total = recommendationLog.totalRecommendations();
        if (recommendationId >= total) return false;
        SentinelRecommendationLog.Recommendation memory rec =
            recommendationLog.getRecommendation(recommendationId);
        if (rec.user != owner) return false;
        if (block.timestamp < rec.timestamp || block.timestamp - rec.timestamp > MAX_RECOMMENDATION_AGE) {
            return false;
        }
        return true;
    }

    /**
     * @dev Replicates policy check logic (from the previous guard) so we don't need an external call.
     */
    function _checkPolicyFor(
        address owner,
        uint256 resultingProtocolExposureBps,
        uint256 resultingLeverageBps,
        bool hasRecentRecommendation
    ) internal view {
        SentinelPolicyRegistry.Policy memory p = policyRegistry.getPolicy(owner);
        if (!p.exists) revert PolicyNotSet();

        if (
            p.maxProtocolExposureBps > 0 &&
            resultingProtocolExposureBps > p.maxProtocolExposureBps
        ) {
            revert ActionNotAllowed();
        }
        if (p.maxLeverageBps > 0 && resultingLeverageBps > p.maxLeverageBps) {
            revert ActionNotAllowed();
        }
        if (p.requireRecommendationLog && !hasRecentRecommendation) {
            revert ActionNotAllowed();
        }
    }

    /**
     * @notice View: returns whether a given recommendation id is valid and recent for the owner.
     */
    function isValidRecentRecommendation(address owner, uint256 recommendationId)
        external
        view
        returns (bool)
    {
        return _isValidRecentRecommendation(owner, recommendationId);
    }
}
