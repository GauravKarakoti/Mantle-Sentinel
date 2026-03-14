export const POLICY_REGISTRY_ADDRESS =
  (process.env.NEXT_PUBLIC_POLICY_REGISTRY_ADDRESS as `0x${string}`) ??
  ("0x0000000000000000000000000000000000000000" as const);

export const RECOMMENDATION_LOG_ADDRESS =
  (process.env.NEXT_PUBLIC_RECOMMENDATION_LOG_ADDRESS as `0x${string}`) ??
  ("0x0000000000000000000000000000000000000000" as const);

export const SENTINEL_GUARD_ADDRESS =
  (process.env.NEXT_PUBLIC_SENTINEL_GUARD_ADDRESS as `0x${string}`) ??
  ("0x0000000000000000000000000000000000000000" as const);

export const policyRegistryAbi = [
  {
    name: "setPolicy",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "maxProtocolExposureBps", type: "uint256" },
      { name: "maxLeverageBps", type: "uint256" },
      { name: "requireRecommendationLog", type: "bool" },
    ],
    outputs: [],
  },
  {
    name: "getPolicy",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "owner", type: "address" }],
    outputs: [
      { name: "exists", type: "bool" },
      { name: "maxProtocolExposureBps", type: "uint256" },
      { name: "maxLeverageBps", type: "uint256" },
      { name: "requireRecommendationLog", type: "bool" },
    ],
  },
] as const;

export const recommendationLogAbi = [
  {
    name: "totalRecommendations",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "getRecommendation",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "id", type: "uint256" }],
    outputs: [
      { name: "user", type: "address" },
      { name: "inputHash", type: "bytes32" },
      { name: "summaryHash", type: "bytes32" },
      { name: "riskLevel", type: "uint8" },
      { name: "timestamp", type: "uint64" },
    ],
  },
] as const;

export const sentinelGuardAbi = [
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "user", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "withdraw",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "amount", type: "uint256" }],
    outputs: [],
  },
  {
    name: "execute",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "target", type: "address" },
      { name: "value", type: "uint256" },
      { name: "data", type: "bytes" },
      { name: "expectedExposureBps", type: "uint256" },
      { name: "expectedLeverageBps", type: "uint256" },
      { name: "recommendationId", type: "uint256" },
    ],
    outputs: [],
  },
  {
    name: "isValidRecentRecommendation",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "recommendationId", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
] as const;
