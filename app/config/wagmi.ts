import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { http } from "wagmi";
import { mantle } from "./chains";

const projectId =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "YOUR_PROJECT_ID";

export const config = getDefaultConfig({
  appName: "Mantle Sentinel",
  projectId,
  chains: [mantle],
  ssr: true,
  transports: {
    [mantle.id]: http(
      process.env.NEXT_PUBLIC_MANTLE_RPC_URL ?? "https://rpc.mantle.xyz"
    ),
  },
});
