"use client";

import { useEffect, useState } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  useSendTransaction,
  useChainId,
  useSwitchChain,
} from "wagmi";
import { parseEther, encodeFunctionData, parseAbiItem } from "viem";
import {
  POLICY_REGISTRY_ADDRESS,
  RECOMMENDATION_LOG_ADDRESS,
  SENTINEL_GUARD_ADDRESS,
  policyRegistryAbi,
  recommendationLogAbi,
  sentinelGuardAbi,
} from "./config/contracts";
import { mantle } from "./config/chains";

export default function HomePage() {
  const chainId = useChainId();
  const { switchChain, isPending: isSwitchPending } = useSwitchChain();
  const { address, isConnected, isConnecting, isReconnecting } = useAccount();
  const PREDEFINED_FUNCTIONS = [
    { 
      label: "Transfer (ERC20)", 
      signature: "function transfer(address to, uint256 amount)", 
      args: [{ name: "to", placeholder: "0x..." }, { name: "amount in wei(10^18)", placeholder: "e.g. 1000000000000000000" }] 
    },
    { 
      label: "Approve (ERC20)", 
      signature: "function approve(address spender, uint256 amount)", 
      args: [{ name: "spender", placeholder: "0x..." }, { name: "amount in wei(10^18)", placeholder: "e.g. 1000000000000000000" }] 
    }
  ];
  const [maxExposure, setMaxExposure] = useState("0");
  const [maxLeverage, setMaxLeverage] = useState("0");
  const [requireRecLog, setRequireRecLog] = useState(true);
  const [status, setStatus] = useState<string | null>(null);
  const [aiText, setAiText] = useState("");
  const [aiAction, setAiAction] = useState("");
  const [selectedFuncIndex, setSelectedFuncIndex] = useState(0);
  const [funcArgValues, setFuncArgValues] = useState<Record<string, string>>({});
  const [isEvaluationExpanded, setIsEvaluationExpanded] = useState(false);
  const [portfolio, setPortfolio] = useState<{
    summary: string;
    nativeBalanceFormatted: string;
    tokens: Array<{ symbol: string; balanceFormatted: string }>;
  } | null>(null);
  const [portfolioLoading, setPortfolioLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<{
    riskLevel: number;
    explanation: string;
    suggestion: string;
  } | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [guardDepositAmount, setGuardDepositAmount] = useState("");
  const [guardWithdrawAmount, setGuardWithdrawAmount] = useState("");
  const [executeTarget, setExecuteTarget] = useState("");
  const [executeValue, setExecuteValue] = useState("");
  const [executeData, setExecuteData] = useState("0x");
  const [calldataMode, setCalldataMode] = useState<"raw" | "encode">("raw");
  const [funcSignature, setFuncSignature] = useState("function transfer(address to, uint256 amount)");
  const [funcArgs, setFuncArgs] = useState("");
  const [executeExposureBps, setExecuteExposureBps] = useState(maxExposure);
  const [executeLeverageBps, setExecuteLeverageBps] = useState(maxLeverage);
  const [guardStatus, setGuardStatus] = useState<string | null>(null);

  const isWrongChain = isConnected && chainId !== mantle.id;

  // Load policy from chain when connected
  const { data: policyData, refetch: refetchPolicy } = useReadContract({
    address: POLICY_REGISTRY_ADDRESS,
    abi: policyRegistryAbi,
    functionName: "getPolicy",
    args: address ? [address] : undefined,
  });

  useEffect(() => {
    if (policyData && policyData[0]) {
      // Extract values to local variables first
      const newMaxExposure = policyData[1].toString();
      const newMaxLeverage = policyData[2].toString();

      setMaxExposure(newMaxExposure);
      setMaxLeverage(newMaxLeverage);
      setRequireRecLog(policyData[3]);
      
      // Use the local variables, NOT the state variables
      setExecuteExposureBps(newMaxExposure);
      setExecuteLeverageBps(newMaxLeverage);
      
      setStatus("Loaded existing policy from chain.");
    }
  }, [policyData]);

  const { data: totalRecs } = useReadContract({
    address: RECOMMENDATION_LOG_ADDRESS,
    abi: recommendationLogAbi,
    functionName: "totalRecommendations",
  });

  const lastRecId = totalRecs !== undefined && totalRecs > 0n ? totalRecs - 1n : undefined;

  const { data: lastRec } = useReadContract({
    address: RECOMMENDATION_LOG_ADDRESS,
    abi: recommendationLogAbi,
    functionName: "getRecommendation",
    args: lastRecId !== undefined ? [lastRecId] : undefined,
  });

  const lastRecData = lastRec as any[] | undefined;
  
  // Safely grab the user property (checking if it's an array first)
  const recUser = Array.isArray(lastRecData) ? lastRecData[0] : null;

  const latestRisk = address && recUser && typeof recUser === 'string' && recUser.toLowerCase() === address.toLowerCase()
    ? { 
        title: lastRecData![1], 
        evaluation: lastRecData![2], 
        riskLevel: Number(lastRecData![3]), 
        timestamp: Number(lastRecData![4]) 
      } 
    : null;
  const myLatestRecommendationId = latestRisk ? lastRecId : undefined;

  const { data: guardBalance, refetch: refetchGuardBalance } = useReadContract({
    address: SENTINEL_GUARD_ADDRESS,
    abi: sentinelGuardAbi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
  });

  const { sendTransaction: sendDeposit, data: depositTxHash, isPending: isDepositPending } = useSendTransaction();
  const { isLoading: isDepositConfirming, isSuccess: isDepositConfirmed } = useWaitForTransactionReceipt({ hash: depositTxHash });
  useEffect(() => {
    if (isDepositConfirmed) refetchGuardBalance();
  }, [isDepositConfirmed, refetchGuardBalance]);
  const {
    writeContract: writeGuardWithdraw,
    data: withdrawTxHash,
    isPending: isWithdrawPending,
    error: withdrawError,
  } = useWriteContract();
  const {
    writeContract: writeGuardExecute,
    data: executeTxHash,
    isPending: isExecutePending,
    error: executeError,
  } = useWriteContract();

  const { isLoading: isWithdrawConfirming, isSuccess: isWithdrawSuccess } =
    useWaitForTransactionReceipt({ hash: withdrawTxHash });
  const { isLoading: isExecuteConfirming, isSuccess: isExecuteSuccess } =
    useWaitForTransactionReceipt({ hash: executeTxHash });

  useEffect(() => {
    if (withdrawError) setGuardStatus((withdrawError as { shortMessage?: string })?.shortMessage ?? withdrawError.message ?? "Withdraw failed");
  }, [withdrawError]);
  useEffect(() => {
    if (executeError) setGuardStatus((executeError as { shortMessage?: string })?.shortMessage ?? executeError.message ?? "Execute failed");
  }, [executeError]);
  useEffect(() => {
    if (isWithdrawSuccess) {
      setGuardStatus("Withdrawal successful.");
      refetchGuardBalance();
    }
  }, [isWithdrawSuccess, refetchGuardBalance]);
  useEffect(() => {
    if (isExecuteSuccess) {
      setGuardStatus("Execution successful.");
      refetchGuardBalance();
    }
  }, [isExecuteSuccess, refetchGuardBalance]);

  const {
    writeContract: writeSetPolicy,
    data: setPolicyTxHash,
    isPending: isWritePending,
    error: writeError,
  } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash: setPolicyTxHash });

  useEffect(() => {
    if (writeError) {
      setStatus((writeError as { shortMessage?: string })?.shortMessage ?? writeError.message ?? "Failed to save policy.");
    }
  }, [writeError]);

  useEffect(() => {
    if (isConfirmed) {
      setStatus("Policy saved on Mantle.");
      refetchPolicy();
    }
  }, [isConfirmed, refetchPolicy]);

  const savePolicy = () => {
    setStatus(null);
    writeSetPolicy({
      address: POLICY_REGISTRY_ADDRESS,
      abi: policyRegistryAbi,
      functionName: "setPolicy",
      args: [BigInt(maxExposure), BigInt(maxLeverage), requireRecLog],
    });
  };

  const loading = isWritePending || isConfirming;

  const fetchPortfolioForAccount = async (addr: string) => {
    setPortfolioLoading(true);
    setPortfolio(null);
    try {
      const res = await fetch(`/api/portfolio?address=${encodeURIComponent(addr)}`);
      if (!res.ok) throw new Error("Failed to fetch portfolio");
      const data = await res.json();
      setPortfolio({
        summary: data.summary,
        nativeBalanceFormatted: data.nativeBalanceFormatted,
        tokens: (data.tokens ?? []).map((t: { symbol: string; balanceFormatted: string }) => ({
          symbol: t.symbol,
          balanceFormatted: t.balanceFormatted,
        })),
      });
      return data;
    } catch (err) {
      console.error(err);
      return null;
    } finally {
      setPortfolioLoading(false);
    }
  };

  const runAiRiskAnalysis = async () => {
    setAiLoading(true);
    setAiResponse(null);
    setStatus(null);
    try {
      let portfolioData: { summary: string } | null = null;
      if (address) {
        const data = await fetchPortfolioForAccount(address);
        if (data) portfolioData = { summary: data.summary };
      }
      const body: {
        portfolio?: { summary: string };
        positionsDescription?: string;
        intendedAction: string;
        userAddress?: string;
      } = { 
        intendedAction: aiAction,
        userAddress: address
      };
      if (portfolioData) {
        body.portfolio = portfolioData;
        if (aiText.trim()) body.positionsDescription = `Additional context: ${aiText.trim()}`;
      } else {
        body.positionsDescription = aiText;
      }
      const res = await fetch("/api/recommendation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error ?? "Failed to get AI recommendation");
      }
      const data = await res.json();
      setAiResponse(data);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "AI analysis failed");
    } finally {
      setAiLoading(false);
    }
  };

  const depositToGuard = () => {
    if (!address || !guardDepositAmount) return;
    setGuardStatus(null);
    const value = parseEther(guardDepositAmount);
    sendDeposit({ to: SENTINEL_GUARD_ADDRESS, value });
  };

  const withdrawFromGuard = () => {
    if (!guardWithdrawAmount) return;
    setGuardStatus(null);
    writeGuardWithdraw({
      address: SENTINEL_GUARD_ADDRESS,
      abi: sentinelGuardAbi,
      functionName: "withdraw",
      args: [parseEther(guardWithdrawAmount)],
    });
  };

  const executeViaGuard = () => {
    if (!executeTarget || !address) return;
    setGuardStatus(null);
    let data: `0x${string}` = "0x";
    if (calldataMode === "raw") {
      try {
        if (executeData.trim() && executeData.trim() !== "0x") {
          data = executeData.trim() as `0x${string}`;
          if (!data.startsWith("0x")) data = `0x${data}` as `0x${string}`;
        }
      } catch {
        setGuardStatus("Invalid calldata hex.");
        return;
      }
    } else {
      try {
        const selectedFunc = PREDEFINED_FUNCTIONS[selectedFuncIndex];
        const abiItem = parseAbiItem(selectedFunc.signature);
        if (!abiItem || abiItem.type !== "function") throw new Error("Invalid signature format");
        
        const parsedArgs = selectedFunc.args.map(arg => funcArgValues[arg.name]?.trim() || "");
        
        data = encodeFunctionData({
          abi: [abiItem],
          functionName: abiItem.name,
          args: parsedArgs,
        });
      } catch (err) {
        setGuardStatus(`ABI Encoding failed: ${err instanceof Error ? err.message : "Check your arguments."}`);
        return;
      }
    }

    const valueWei = executeValue.trim() ? (executeValue.trim().includes(".") ? parseEther(executeValue.trim()) : BigInt(executeValue.trim())) : 0n;
    writeGuardExecute({
      address: SENTINEL_GUARD_ADDRESS,
      abi: sentinelGuardAbi,
      functionName: "execute",
      args: [
        executeTarget as `0x${string}`,
        valueWei,
        data,
        BigInt(executeExposureBps || "0"),
        BigInt(executeLeverageBps || "10000"),
        myLatestRecommendationId ?? 0n,
      ],
    });
  };

  return (
    <div>
      <section className="space-y-6 text-center md:text-left flex flex-col md:flex-row items-center justify-between">
        <div className="space-y-4 max-w-2xl">
          <div className="pill inline-flex items-center gap-3 px-4 py-1.5 w-fit">
            <span className="badge">Prototype</span>
            <span className="text-xs font-medium text-blue-200">
              Mantle + AI + Onchain Risk Policies
            </span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-blue-500">
            Mantle Sentinel
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed">
            An AI-powered risk and strategy co-pilot for Mantle. Set onchain guardrails
            that your future transactions must respect, and pair them with AI
            recommendations and explanations.
          </p>
        </div>

        <div className="flex flex-col gap-3 mt-6 md:mt-0 min-w-[200px]">
          {isWrongChain && (
            <button
              type="button"
              className="button-primary w-full"
              onClick={() => switchChain?.({ chainId: mantle.id })}
              disabled={isSwitchPending}
            >
              {isSwitchPending ? "Switching…" : "Switch to Mantle"}
            </button>
          )}
          <ConnectButton
            chainStatus="icon"
            showBalance={false}
          />
          <a
            className="button-secondary w-full text-center"
            href="https://docs.mantle.xyz"
            target="_blank"
            rel="noreferrer"
          >
            View Mantle Docs
          </a>
        </div>
      </section>

      {(isConnecting || isReconnecting) && (
        <p className="mt-4 text-sm text-center text-slate-400">Connecting wallet…</p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-8">
          <section className="card p-6 md:p-8 space-y-6">
            <div>
              <h2 className="text-2xl font-semibold mb-2">Onchain Risk Policy</h2>
              <p className="text-sm text-slate-400">
                A minimal prototype of the{" "}
                <code className="text-emerald-400 bg-emerald-400/10 px-1 rounded">
                  SentinelPolicyRegistry
                </code>
                . These values are stored onchain to enforce vault guardrails.
              </p>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium mb-1.5 text-slate-200">
                  Max protocol exposure (bps)
                </label>
                <input
                  className="input"
                  type="number"
                  min={0}
                  max={10000}
                  value={maxExposure}
                  onChange={(e) => {
                    setMaxExposure(e.target.value)
                    setExecuteExposureBps(e.target.value);
                  }}
                />
                <p className="mt-1.5 text-xs text-slate-500">
                  2000 = 20% exposure cap to any single protocol.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5 text-slate-200">
                  Max leverage (bps)
                </label>
                <input
                  className="input"
                  type="number"
                  min={10000}
                  value={maxLeverage}
                  onChange={(e) => {
                    setMaxLeverage(e.target.value)
                    setExecuteLeverageBps(e.target.value)
                  }}
                />
                <p className="mt-1.5 text-xs text-slate-500">
                  30000 = 3x leverage cap across your positions.
                </p>
              </div>

              <label className="flex items-start gap-3 mt-4 p-4 border border-slate-700/50 rounded-lg bg-slate-800/20 cursor-pointer hover:bg-slate-800/40 transition-colors">
                <input
                  id="requireRec"
                  type="checkbox"
                  className="mt-1 accent-emerald-500"
                  checked={requireRecLog}
                  onChange={(e) => setRequireRecLog(e.target.checked)}
                />
                <span className="text-sm text-slate-300">
                  Require a recent AI recommendation log before allowing sensitive
                  transactions.
                </span>
              </label>
            </div>

            <div className="pt-2">
              <button
                className="button-primary w-full"
                onClick={savePolicy}
                disabled={loading || !isConnected || isWrongChain}
              >
                {loading ? "Saving to Mantle…" : "Save Policy Onchain"}
              </button>
              {status && (
                <p className="mt-3 text-sm text-center text-emerald-400 bg-emerald-400/10 py-2 rounded">
                  {status}
                </p>
              )}
            </div>
          </section>
          
          <section className="card p-6 md:p-8 space-y-4">
            <div>
              <h2 className="text-xl font-semibold mb-2">Sentinel Guard (Proxy)</h2>
              <p className="text-sm text-slate-400">
                Deposit funds into the guard. Trades executed via the guard are checked
                against your policy and (if enabled) a recent AI recommendation.
              </p>
            </div>
            {guardBalance !== undefined && (
              <div className="p-4 rounded-lg bg-slate-800/40 border border-slate-700/50 flex items-center justify-between">
                <span className="text-sm text-slate-400">Your balance in guard</span>
                <span className="font-mono text-slate-200">
                  {guardBalance !== undefined
                    ? `${(Number(guardBalance) / 1e18).toFixed(4)} MNT`
                    : "—"}
                </span>
              </div>
            )}
            <div className="flex gap-2">
              <input
                className="input flex-1"
                type="text"
                placeholder="Deposit amount (MNT)"
                value={guardDepositAmount}
                onChange={(e) => setGuardDepositAmount(e.target.value)}
              />
              <button
                type="button"
                className="button-primary whitespace-nowrap"
                onClick={depositToGuard}
                disabled={isDepositPending || isDepositConfirming || !guardDepositAmount || !isConnected || isWrongChain}
              >
                {isDepositPending || isDepositConfirming ? "Depositing…" : "Deposit"}
              </button>
            </div>
            <div className="flex gap-2">
              <input
                className="input flex-1"
                type="text"
                placeholder="Withdraw amount (MNT)"
                value={guardWithdrawAmount}
                onChange={(e) => setGuardWithdrawAmount(e.target.value)}
              />
              <button
                type="button"
                className="button-secondary whitespace-nowrap"
                onClick={withdrawFromGuard}
                disabled={
                  isWithdrawPending ||
                  isWithdrawConfirming ||
                  !guardWithdrawAmount ||
                  !isConnected ||
                  isWrongChain
                }
              >
                {isWithdrawPending || isWithdrawConfirming ? "Withdrawing…" : "Withdraw"}
              </button>
            </div>
            <div className="border-t border-slate-700/50 pt-4 space-y-2">
              <p className="text-xs font-medium text-slate-400">Execute via guard</p>
              <input
                className="input text-sm font-mono"
                type="text"
                placeholder="Target address"
                value={executeTarget}
                onChange={(e) => setExecuteTarget(e.target.value)}
              />
              <input
                className="input text-sm"
                type="text"
                placeholder="Value (wei or MNT)"
                value={Number(executeValue)/1000000000000000000}
                onChange={(e) => setExecuteValue((Number(e.target.value) * 1000000000000000000).toString())}
              />
              <div className="space-y-2">
                <div className="flex gap-2 mb-1">
                  <button
                    type="button"
                    className={`text-xs px-3 py-1.5 rounded transition-colors ${calldataMode === "raw" ? "bg-slate-700 text-white" : "text-slate-400 hover:text-slate-200 bg-slate-800/50"}`}
                    onClick={() => setCalldataMode("raw")}
                  >
                    Raw Calldata
                  </button>
                  <button
                    type="button"
                    className={`text-xs px-3 py-1.5 rounded transition-colors ${calldataMode === "encode" ? "bg-slate-700 text-white" : "text-slate-400 hover:text-slate-200 bg-slate-800/50"}`}
                    onClick={() => setCalldataMode("encode")}
                  >
                    ABI Encoder
                  </button>
                </div>

                {calldataMode === "raw" ? (
                  <input
                    className="input text-sm font-mono"
                    type="text"
                    placeholder="Calldata (0x...)"
                    value={executeData}
                    onChange={(e) => setExecuteData(e.target.value)}
                  />
                ) : (
                  <div className="space-y-3 p-3 bg-slate-800/30 rounded-lg border border-slate-700/50">
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">Select Function</label>
                      <select 
                        className="input text-sm font-mono w-full appearance-none cursor-pointer"
                        value={selectedFuncIndex}
                        onChange={(e) => {
                          setSelectedFuncIndex(Number(e.target.value));
                          setFuncArgValues({}); // Reset arguments when changing function
                        }}
                      >
                        {PREDEFINED_FUNCTIONS.map((fn, idx) => (
                          <option key={idx} value={idx}>{fn.label}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="space-y-2">
                      {PREDEFINED_FUNCTIONS[selectedFuncIndex].args.map((arg) => (
                        <div key={arg.name}>
                          <label className="text-xs text-slate-400 mb-1 block capitalize">{arg.name}</label>
                          <input
                            className="input text-sm font-mono"
                            type="text"
                            placeholder={arg.placeholder}
                            value={funcArgValues[arg.name] || ""}
                            onChange={(e) => setFuncArgValues(prev => ({ ...prev, [arg.name]: e.target.value }))}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <input
                  className="input flex-1 text-sm"
                  type="text"
                  placeholder="Expected exposure bps"
                  value={executeExposureBps}
                  onChange={(e) => setExecuteExposureBps(e.target.value)}
                />
                <input
                  className="input flex-1 text-sm"
                  type="text"
                  placeholder="Expected leverage bps"
                  value={executeLeverageBps}
                  onChange={(e) => setExecuteLeverageBps(e.target.value)}
                />
              </div>
              <p className="text-xs text-slate-500">
                Recommendation ID: {myLatestRecommendationId?.toString() ?? "0"} (use 0 if not required)
              </p>
              <button
                type="button"
                className="button-secondary w-full"
                onClick={executeViaGuard}
                disabled={
                  isExecutePending ||
                  isExecuteConfirming ||
                  !executeTarget ||
                  !isConnected ||
                  isWrongChain
                }
              >
                {isExecutePending || isExecuteConfirming ? "Executing…" : "Execute via Guard"}
              </button>
            </div>
            {guardStatus && (
              <p className="text-sm text-center text-emerald-400 bg-emerald-400/10 py-2 rounded">
                {guardStatus}
              </p>
            )}
          </section>
        </div>

        <div className="space-y-8">
          <section className="card p-6 md:p-8 space-y-6 flex flex-col">
            <div>
              <h2 className="text-2xl font-semibold mb-2">AI Co-Pilot Simulator</h2>
              <p className="text-sm text-slate-400">
                Test the offchain AI evaluation loop before it logs to the contract.
              </p>
            </div>

            <div className="space-y-4 flex-grow">
              {isConnected && !isWrongChain ? (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1.5 text-slate-200">
                      On-chain portfolio (Mantle)
                    </label>
                    <div className="flex items-center gap-2 mb-2">
                      <button
                        type="button"
                        className="button-secondary text-sm py-1.5 px-3"
                        onClick={() => address && fetchPortfolioForAccount(address)}
                        disabled={portfolioLoading}
                      >
                        {portfolioLoading ? "Loading…" : "Refresh portfolio"}
                      </button>
                      <span className="text-xs text-slate-500">
                        Fetched from Mantle RPC; used for AI to prevent inaccurate
                        input.
                      </span>
                    </div>
                    <div className="input resize-none min-h-[80px] whitespace-pre-wrap text-slate-300">
                      {portfolio
                        ? portfolio.summary
                        : "Click “Refresh portfolio” or “Run AI Risk Analysis” to load your token balances and native MNT."}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5 text-slate-200">
                      Additional context (optional)
                    </label>
                    <textarea
                      className="input resize-none"
                      rows={2}
                      value={aiText}
                      onChange={(e) => setAiText(e.target.value)}
                      placeholder="e.g. LP positions in Agni, debt in a lending protocol..."
                    />
                  </div>
                </>
              ) : (
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-slate-200">
                    Current Position Context
                  </label>
                  <textarea
                    className="input resize-none"
                    rows={3}
                    value={aiText}
                    onChange={(e) => setAiText(e.target.value)}
                    placeholder="Connect wallet to auto-fill from chain, or describe manually: e.g. 50% stables, 50% in blue-chip LP..."
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium mb-1.5 text-slate-200">
                  Proposed Transaction / Action
                </label>
                <textarea
                  className="input resize-none"
                  rows={3}
                  value={aiAction}
                  onChange={(e) => setAiAction(e.target.value)}
                  placeholder="e.g. open 3x leveraged long on volatile asset..."
                />
              </div>
            </div>

            <button
              className="button-secondary w-full border-blue-500/30 hover:bg-blue-500/10 text-blue-400"
              onClick={runAiRiskAnalysis}
              disabled={aiLoading}
            >
              {aiLoading ? "Analyzing Strategy…" : "Run AI Risk Analysis"}
            </button>

            {aiResponse && (
              <div className="mt-4 p-5 rounded-lg bg-blue-900/10 border border-blue-500/20 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-center justify-between pb-3 border-b border-blue-500/10">
                  <span className="text-sm font-medium text-blue-200">
                    Analysis Complete
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="badge badge-risk">Risk Score</span>
                    <span className="font-bold text-slate-200">
                      {aiResponse.riskLevel}/5
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Explanation
                  </p>
                  <p className="text-sm text-slate-300">{aiResponse.explanation}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Suggested Action
                  </p>
                  <p className="text-sm text-slate-300">{aiResponse.suggestion}</p>
                </div>
              </div>
            )}
          </section>
          <section className="card p-6 md:p-8 space-y-4">
            <div>
              <h2 className="text-xl font-semibold mb-2">Latest AI Snapshot</h2>
              <p className="text-sm text-slate-400">
                Reads from{" "}
                <code className="text-blue-400 bg-blue-400/10 px-1 rounded">
                  SentinelRecommendationLog
                </code>
                .
              </p>
            </div>

            {latestRisk ? (
              <div className="p-4 rounded-lg bg-slate-800/40 border border-slate-700/50 flex flex-col gap-3 transition-all">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-200 mb-1">
                      {latestRisk.title || "Current Evaluation"}
                    </p>
                    <p className="text-xs text-slate-500">
                      {new Date(latestRisk.timestamp * 1000).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-2">
                      <span className="badge badge-risk">Risk Level</span>
                      <span className="text-xl font-bold text-slate-200">
                        {latestRisk.riskLevel}/5
                      </span>
                    </div>
                  </div>
                </div>
                
                <button 
                  onClick={() => setIsEvaluationExpanded(!isEvaluationExpanded)}
                  className="text-xs text-slate-400 hover:text-slate-200 text-left underline underline-offset-2 w-fit mt-1"
                >
                  {isEvaluationExpanded ? "Hide Details" : "View Evaluation"}
                </button>
                
                {isEvaluationExpanded && latestRisk.evaluation && (
                  <div className="mt-2 p-3 bg-slate-800/60 rounded border border-slate-700/50 text-sm text-slate-300 whitespace-pre-wrap">
                    {latestRisk.evaluation}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 rounded-lg bg-slate-800/20 border border-slate-700/50 border-dashed text-center">
                <p className="text-sm text-slate-500">
                  {isConnected
                    ? "No AI recommendations logged for your address yet."
                    : "Connect your wallet to see your latest recommendation."}
                </p>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}