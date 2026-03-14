import { defineChain } from "viem";

/**
 * Mantle Mainnet (chainId 5000).
 * Used by Wagmi + RainbowKit for network switching and RPC.
 */
export const mantle = defineChain({
  id: 5000,
  name: "Mantle",
  nativeCurrency: {
    name: "MNT",
    symbol: "MNT",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: [
        process.env.NEXT_PUBLIC_NEXT_PUBLIC_MANTLE_RPC_URL ?? "https://rpc.mantle.xyz",
      ],
    },
  },
  blockExplorers: {
    default: {
      name: "Mantle Explorer",
      url: "https://explorer.mantle.xyz",
    },
  },
});
