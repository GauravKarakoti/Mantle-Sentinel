/**
 * Curated list of Mantle mainnet (chainId 5000) tokens for portfolio indexing.
 * Used to fetch ERC20 balances via RPC. Native MNT is fetched with eth_getBalance.
 */
export const MANTLE_CHAIN_ID = 5000;

export interface MantleToken {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
}

/** Mainnet Mantle tokens: stables, blue chips, common DeFi. */
export const MANTLE_TOKENS: MantleToken[] = [
  { address: "0xDeadDeAddeAddEAddeadDEaDDEAdDeaDDeAD0000", symbol: "WMNT", name: "Wrapped Mantle", decimals: 18 },
  { address: "0x09Bc4E0D864854c6aFB6eB9A9cdF58aC190D0dF9", symbol: "USDC", name: "USD Coin", decimals: 6 },
  { address: "0x201EBa5CC46D216Ce6DC03F6a759e8E766e956aE", symbol: "USDT", name: "Tether USD", decimals: 6 },
  { address: "0xdEAddEaDdeadDEadDEADDEAddEADDEAddead1111", symbol: "WETH", name: "Wrapped ETH", decimals: 18 },
  { address: "0xCAbAE6f6Ea1ecaB08Ad02fE02ce9A44F09aebfA2", symbol: "WBTC", name: "Wrapped BTC", decimals: 8 },
  { address: "0xf93a85d53e4aF0D62bdf3A83CCFc1EcF3EAf9F32", symbol: "LUSD", name: "LUSD Stablecoin", decimals: 18 },
  { address: "0x0994206dfE8De6Ec6920FF4D779B0d950605Fb53", symbol: "crvUSD", name: "Curve.Fi USD", decimals: 18 },
  { address: "0x5d3a1Ff2b6BAb83b63cd9AD0787074081a52ef34", symbol: "USDe", name: "USDe", decimals: 18 },
  { address: "0x211Cc4DD073734dA055fbF44a2b4667d5E5fE5d2", symbol: "sUSDe", name: "sUSDe", decimals: 18 },
  { address: "0xcDA86A272531e8640cD7F1a92c01839911B90bb0", symbol: "mETH", name: "mETH", decimals: 18 },
  { address: "0xd27B18915e7acc8FD6Ac75DB6766a80f8D2f5729", symbol: "PENDLE", name: "PENDLE", decimals: 18 },
  { address: "0x52b7D8851d6CcBC6342ba0855Be65f7B82A3F17f", symbol: "COMP", name: "Compound", decimals: 18 },
  { address: "0xE265FC71d45fd791c9ebf3EE0a53FBB220Eb8f75", symbol: "CRV", name: "Curve DAO Token", decimals: 18 },
  { address: "0x2dB08783F13c4225A1963b2437f0D459a5BCB4D8", symbol: "UNI", name: "Uniswap", decimals: 18 },
  { address: "0x96630b0D78d29E7E8d87f8703dE7c14b2d5AE413", symbol: "APEX", name: "ApeX Token", decimals: 18 },
  { address: "0x60D01EC2D5E98Ac51C8B4cF84DfCCE98D527c747", symbol: "IZI", name: "iZUMi Finance", decimals: 18 },
];

const ERC20_BALANCE_OF = "0x70a08231"; // balanceOf(address)
const ERC20_BALANCE_OF_ARG_LEN = 64;

function encodeBalanceOf(userAddress: string): string {
  return ERC20_BALANCE_OF + userAddress.slice(2).toLowerCase().padStart(64, "0");
}

export interface TokenBalance {
  symbol: string;
  name: string;
  address: string;
  balance: string;
  decimals: number;
  balanceFormatted: string;
}

export interface PortfolioData {
  address: string;
  nativeBalance: string;
  nativeBalanceFormatted: string;
  tokens: TokenBalance[];
  summary: string;
}

function formatUnits(value: bigint, decimals: number): string {
  const divisor = 10 ** decimals;
  const intPart = value / BigInt(divisor);
  const fracPart = value % BigInt(divisor);
  const fracStr = fracPart.toString().padStart(decimals, "0").slice(0, 6).replace(/0+$/, "") || "0";
  return fracStr ? `${intPart}.${fracStr}` : intPart.toString();
}

/**
 * Fetch native MNT balance and ERC20 balances for the curated token list via Mantle RPC.
 */
export async function fetchPortfolioFromRpc(
  rpcUrl: string,
  userAddress: string
): Promise<PortfolioData> {
  const addr = userAddress.startsWith("0x") ? userAddress : `0x${userAddress}`;

  const [nativeRes, ...tokenResps] = await Promise.all([
    fetch(rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "eth_getBalance",
        params: [addr, "latest"],
      }),
    }).then((r) => r.json()),
    ...MANTLE_TOKENS.map((t) =>
      fetch(rpcUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "eth_call",
          params: [
            {
              to: t.address,
              data: encodeBalanceOf(addr),
            },
            "latest",
          ],
        }),
      }).then((r) => r.json())
    ),
  ]);

  const nativeHex = nativeRes?.result ?? "0x0";
  const nativeBalance = BigInt(nativeHex);
  const nativeBalanceFormatted = formatUnits(nativeBalance, 18);

  const tokens: TokenBalance[] = [];
  MANTLE_TOKENS.forEach((t, i) => {
    const res = tokenResps[i];
    const hex = res?.result ?? "0x0";
    const balance = BigInt(hex);
    if (balance > 0n) {
      tokens.push({
        symbol: t.symbol,
        name: t.name,
        address: t.address,
        balance: balance.toString(),
        decimals: t.decimals,
        balanceFormatted: formatUnits(balance, t.decimals),
      });
    }
  });

  const lines: string[] = [];
  if (nativeBalance > 0n) {
    lines.push(`Native MNT: ${nativeBalanceFormatted}`);
  }
  tokens.forEach((t) => {
    lines.push(`${t.symbol}: ${t.balanceFormatted}`);
  });
  const summary =
    lines.length > 0
      ? `On-chain balances on Mantle:\n${lines.join("\n")}`
      : "No detectable token or native balances on Mantle for this address.";

  return {
    address: addr,
    nativeBalance: nativeBalance.toString(),
    nativeBalanceFormatted,
    tokens,
    summary,
  };
}

/**
 * Fetch portfolio using Alchemy Portfolio API if ALCHEMY_API_KEY is set and Alchemy supports Mantle.
 * Falls back to RPC-based fetch otherwise.
 */
export async function fetchPortfolio(
  rpcUrl: string,
  userAddress: string,
  alchemyApiKey?: string | null
): Promise<PortfolioData> {
  if (alchemyApiKey) {
    try {
      const alchemy = await fetchPortfolioFromAlchemy(alchemyApiKey, userAddress);
      if (alchemy) return alchemy;
    } catch {
      // fall through to RPC
    }
  }
  return fetchPortfolioFromRpc(rpcUrl, userAddress);
}

async function fetchPortfolioFromAlchemy(
  apiKey: string,
  userAddress: string
): Promise<PortfolioData | null> {
  const url = `https://api.g.alchemy.com/data/v1/${apiKey}/assets/tokens/balances/by-address`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      addresses: [{ address: userAddress, networks: ["mantle-mainnet"] }],
      includeNativeTokens: true,
      includeErc20Tokens: true,
    }),
  });
  if (!res.ok) return null;
  const data = (await res.json()) as {
    data?: Array<{
      address: string;
      network: string;
      tokenBalances?: Array<{
        contractAddress: string;
        tokenBalance: string;
        symbol?: string;
        name?: string;
        decimals?: number;
      }>;
    }>;
  };

  const first = data?.data?.[0];
  if (!first?.tokenBalances) return null;

  const tokens: TokenBalance[] = [];
  let nativeBalance = "0";
  let nativeBalanceFormatted = "0";

  for (const t of first.tokenBalances) {
    const balance = BigInt(t.tokenBalance ?? "0");
    if (balance === 0n) continue;
    const decimals = t.decimals ?? 18;
    const symbol = t.symbol ?? "???";
    const name = t.name ?? symbol;
    tokens.push({
      symbol,
      name,
      address: t.contractAddress,
      balance: balance.toString(),
      decimals,
      balanceFormatted: formatUnits(balance, decimals),
    });
  }

  const lines = tokens.map((t) => `${t.symbol}: ${t.balanceFormatted}`);
  const summary =
    lines.length > 0
      ? `On-chain balances on Mantle (Alchemy):\n${lines.join("\n")}`
      : "No detectable token balances on Mantle for this address.";

  return {
    address: userAddress,
    nativeBalance,
    nativeBalanceFormatted,
    tokens,
    summary,
  };
}
