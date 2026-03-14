/**
 * Curated list of Mantle mainnet (chainId 5000) and testnet (chainId 5003) tokens for portfolio indexing.
 * Used to fetch ERC20 balances via RPC. Native MNT is fetched with eth_getBalance.
 */
export const MANTLE_CHAIN_ID = 5000;

export interface MantleToken {
  chainId: number;
  address: string;
  symbol: string;
  name: string;
  decimals: number;
}

/** Mantle tokens extracted from the official registry (chain IDs 5000 & 5003). */
export const MANTLE_TOKENS: MantleToken[] = [
  { chainId: 5000, address: "0x96630b0D78d29E7E8d87f8703dE7c14b2d5AE413", name: "ApeX Token", symbol: "APEX", decimals: 18 },
  { chainId: 5000, address: "0x91824fc3573c5043837F6357b72F60014A710501", name: "Aperture", symbol: "APTR", decimals: 6 },
  { chainId: 5000, address: "0x23ee2343B892b1BB63503a4FAbc840E0e2C6810f", name: "Axelar", symbol: "AXL", decimals: 6 },
  { chainId: 5000, address: "0x3e65Ac1DD4938e02301c4869d3043903F5dEB474", name: "Baby Doge Coin", symbol: "BabyDoge", decimals: 9 },
  { chainId: 5000, address: "0x3390108e913824b8ead638444cc52b9abdf63798", name: "Bella", symbol: "BEL", decimals: 18 },
  { chainId: 5000, address: "0xE6829d9a7eE3040e1276Fa75293Bde931859e8fA", name: "cmETH", symbol: "cmETH", decimals: 18 },
  { chainId: 5000, address: "0x52b7D8851d6CcBC6342ba0855Be65f7B82A3F17f", name: "Compound", symbol: "COMP", decimals: 18 },
  { chainId: 5000, address: "0x9F0C013016E8656bC256f948CD4B79ab25c7b94D", name: "COOK", symbol: "COOK", decimals: 18 },
  { chainId: 5000, address: "0xE265FC71d45fd791c9ebf3EE0a53FBB220Eb8f75", name: "Curve DAO Token", symbol: "CRV", decimals: 18 },
  { chainId: 5000, address: "0x0994206dfE8De6Ec6920FF4D779B0d950605Fb53", name: "Curve.Fi USD Stablecoin", symbol: "crvUSD", decimals: 18 },
  { chainId: 5000, address: "0xE7798f023fC62146e8Aa1b36Da45fb70855a77Ea", name: "Custom UPS", symbol: "CUPS", decimals: 18 },
  { chainId: 5000, address: "0xD0CF7dfbF09CAfaB8AEf00e0Ce19a4638004a364", name: "DODO bird", symbol: "DODO", decimals: 18 },
  { chainId: 5000, address: "0x056D4A69D243F176F6d1668722BE386c3D50e27b", name: "Ember Sword", symbol: "EMBER", decimals: 18 },
  { chainId: 5003, address: "0x142BF6684010E5672457a5347d05364295dF1e32", name: "Ember Sword", symbol: "EMBER", decimals: 18 },
  { chainId: 5000, address: "0x58538e6A46E07434d7E7375Bc268D3cb839C0133", name: "Ethena Token", symbol: "ENA", decimals: 18 },
  { chainId: 5000, address: "0x9e1028F5F1D5eDE59748FFceE5532509976840E0", name: "Equilibria Pendle", symbol: "ePendle", decimals: 18 },
  { chainId: 5000, address: "0x3e7eF8f50246f725885102E8238CBba33F276747", name: "Equilibria Token", symbol: "EQB", decimals: 18 },
  { chainId: 5000, address: "0xdEAddEaDdeadDEadDEADDEAddEADDEAddead1111", name: "Ether", symbol: "ETH", decimals: 18 },
  { chainId: 5003, address: "0xdEAddEaDdeadDEadDEADDEAddEADDEAddead1111", name: "Ether", symbol: "ETH", decimals: 18 },
  { chainId: 5000, address: "0xC96dE26018A54D51c097160568752c4E3BD6C364", name: "Ignition FBTC", symbol: "FBTC", decimals: 8 },
  { chainId: 5000, address: "0x6eFFF76AcF1698a6a215eCa7D632991678Ec673b", name: "FLOKI", symbol: "FLOKI", decimals: 9 },
  { chainId: 5000, address: "0xFC88835694B1BeFE3506595303e37240F9D6a135", name: "ImpermaxFinance Token", symbol: "IBEX", decimals: 18 },
  { chainId: 5000, address: "0xa29b548056c3fd0f68bad9d4829ec4e66f22f796", name: "Idexo Token", symbol: "IDO", decimals: 18 },
  { chainId: 5000, address: "0x6968f3F16C3e64003F02E121cf0D5CCBf5625a42", name: "IONX", symbol: "IONX", decimals: 18 },
  { chainId: 5000, address: "0x0A3BB08b3a15A19b4De82F8AcFc862606FB69A2D", name: "iZUMi Bond USD", symbol: "iUSD", decimals: 18 },
  { chainId: 5000, address: "0x60D01EC2D5E98Ac51C8B4cF84DfCCE98D527c747", name: "iZUMi Finance", symbol: "IZI", decimals: 18 },
  { chainId: 5000, address: "0xf93a85d53e4aF0D62bdf3A83CCFc1EcF3EAf9F32", name: "LUSD Stablecoin", symbol: "LUSD", decimals: 18 },
  { chainId: 5000, address: "0xDeadDeAddeAddEAddeadDEaDDEAdDeaDDeAD0000", name: "Mantle", symbol: "MNT", decimals: 18 },
  { chainId: 5003, address: "0xDeadDeAddeAddEAddeadDEaDDEAdDeaDDeAD0000", name: "Mantle", symbol: "MNT", decimals: 18 },
  { chainId: 5000, address: "0xcDA86A272531e8640cD7F1a92c01839911B90bb0", name: "mETH", symbol: "mETH", decimals: 18 },
  { chainId: 5003, address: "0x9EF6f9160Ba00B6621e5CB3217BB8b54a92B2828", name: "mETH", symbol: "mETH", decimals: 18 },
  { chainId: 5000, address: "0xd27B18915e7acc8FD6Ac75DB6766a80f8D2f5729", name: "PENDLE", symbol: "PENDLE", decimals: 18 },
  { chainId: 5000, address: "0x8baf44B350eF672232A6673E1e128C7875640477", name: "Pepe", symbol: "PEPE", decimals: 18 },
  { chainId: 5000, address: "0x26a6b0dcdCfb981362aFA56D581e4A7dBA3Be140", name: "Puff", symbol: "PUFF", decimals: 18 },
  { chainId: 5000, address: "0x49397aC9CB061152B770B1D274a5682155F20099", name: "SHIBA INU", symbol: "SHIB", decimals: 18 },
  { chainId: 5000, address: "0x211Cc4DD073734dA055fbF44a2b4667d5E5fE5d2", name: "sUSDe", symbol: "sUSDe", decimals: 18 },
  { chainId: 5000, address: "0x35d48a789904e9b15705977192e5d95e2af7f1d3", name: "Tellor Tributes", symbol: "TRB", decimals: 18 },
  { chainId: 5000, address: "0x2dB08783F13c4225A1963b2437f0D459a5BCB4D8", name: "Uniswap", symbol: "UNI", decimals: 18 },
  { chainId: 5000, address: "0x09Bc4E0D864854c6aFB6eB9A9cdF58aC190D0dF9", name: "USD Coin", symbol: "USDC", decimals: 6 },
  { chainId: 5000, address: "0x5d3a1Ff2b6BAb83b63cd9AD0787074081a52ef34", name: "USDe", symbol: "USDe", decimals: 18 },
  { chainId: 5000, address: "0x8FE7176F0BF63358ad9490fd24Ac0bdB4Dac33a8", name: "USDLR by Stable", symbol: "USDLR", decimals: 6 },
  { chainId: 5000, address: "0x201EBa5CC46D216Ce6DC03F6a759e8E766e956aE", name: "Tether USD", symbol: "USDT (BRIDGED)", decimals: 6 },
  { chainId: 5000, address: "0x779Ded0c9e1022225f8E0630b35a9b54bE713736", name: "USDT0", symbol: "USDT (USDT0)", decimals: 6 },
  { chainId: 5000, address: "0x5bE26527e817998A7206475496fDE1E68957c5A6", name: "Ondo US Dollar Yield", symbol: "USDY", decimals: 18 },
  { chainId: 5000, address: "0xCAbAE6f6Ea1ecaB08Ad02fE02ce9A44F09aebfA2", name: "Wrapped BTC", symbol: "WBTC", decimals: 8 },
  { chainId: 5000, address: "0xdEAddEaDdeadDEadDEADDEAddEADDEAddead1111", name: "Wrapped ETH", symbol: "WETH", decimals: 18 },
  { chainId: 5000, address: "0x458ed78EB972a369799fb278c0243b25e5242A83", name: "Wrapped liquid staked Ether 2.0", symbol: "wstETH", decimals: 18 },
  { chainId: 5003, address: "0xa4c6370CcF0ec33B785B33E81341727e635aCcd0", name: "Wrapped liquid staked Ether 2.0", symbol: "wstETH", decimals: 18 },
  { chainId: 5000, address: "0x6199CCd9273A1E0e41e2cC18d9dAcd1E9382F58E", name: "XAUt", symbol: "XAUt", decimals: 6 }
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

  // Consider passing in target chainId in the function signature if you want to avoid 
  // checking 5003 tokens on the 5000 RPC and vice versa.
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