"use client";

import { useEffect, useState } from "react";
import { BrowserProvider, Contract } from "ethers";

const POLICY_REGISTRY_ADDRESS =
  process.env.NEXT_PUBLIC_POLICY_REGISTRY_ADDRESS ??
  "0x0000000000000000000000000000000000000000";

const POLICY_REGISTRY_ABI = [
  "function setPolicy(uint256 maxProtocolExposureBps, uint256 maxLeverageBps, bool requireRecommendationLog) external",
  "function getPolicy(address owner) external view returns (bool exists, uint256 maxProtocolExposureBps, uint256 maxLeverageBps, bool requireRecommendationLog)"
];

const RECOMMENDATION_LOG_ADDRESS =
  process.env.NEXT_PUBLIC_RECOMMENDATION_LOG_ADDRESS ??
  "0x0000000000000000000000000000000000000000";

const RECOMMENDATION_LOG_ABI = [
  "function totalRecommendations() external view returns (uint256)",
  "function getRecommendation(uint256 id) external view returns (address user, bytes32 inputHash, bytes32 summaryHash, uint8 riskLevel, uint64 timestamp)"
];

export default function HomePage() {
  const [account, setAccount] = useState<string | null>(null);
  const [maxExposure, setMaxExposure] = useState("2000");
  const [maxLeverage, setMaxLeverage] = useState("30000");
  const [requireRecLog, setRequireRecLog] = useState(true);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [latestRisk, setLatestRisk] = useState<{
    riskLevel: number;
    timestamp: number;
  } | null>(null);
  const [aiText, setAiText] = useState("");
  const [aiAction, setAiAction] = useState("");
  const [aiResponse, setAiResponse] = useState<{
    riskLevel: number;
    explanation: string;
    suggestion: string;
  } | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    const autoConnect = async () => {
      if (typeof window === "undefined") return;
      const anyWindow = window as any;
      if (!anyWindow.ethereum) return;
      try {
        const provider = new BrowserProvider(anyWindow.ethereum);
        const signer = await provider.getSigner();
        const addr = await signer.getAddress();
        setAccount(addr);
        await loadExistingPolicy(provider, addr);
        await loadLatestRecommendation(provider, addr);
      } catch {
        // ignore
      }
    };
    autoConnect();
  }, []);

  const connectWallet = async () => {
    if (typeof window === "undefined") return;
    const anyWindow = window as any;
    if (!anyWindow.ethereum) {
      setStatus("No wallet found. Please install MetaMask or a Mantle-compatible wallet.");
      return;
    }
    try {
      const [addr] = await anyWindow.ethereum.request({
        method: "eth_requestAccounts"
      });
      setAccount(addr);
      const provider = new BrowserProvider(anyWindow.ethereum);
      await loadExistingPolicy(provider, addr);
      await loadLatestRecommendation(provider, addr);
      setStatus(null);
    } catch (err: any) {
      setStatus(err?.message ?? "Failed to connect wallet.");
    }
  };

  const loadExistingPolicy = async (provider: BrowserProvider, owner: string) => {
    try {
      const contract = new Contract(
        POLICY_REGISTRY_ADDRESS,
        POLICY_REGISTRY_ABI,
        provider
      );
      const [exists, maxProtocolExposureBps, maxLeverageBps, requireRecommendationLog] =
        await contract.getPolicy(owner);
      if (exists) {
        setMaxExposure(maxProtocolExposureBps.toString());
        setMaxLeverage(maxLeverageBps.toString());
        setRequireRecLog(requireRecommendationLog);
        setStatus("Loaded existing policy from chain.");
      }
    } catch {
      // ignore if not deployed / wrong network
    }
  };

  const loadLatestRecommendation = async (
    provider: BrowserProvider,
    owner: string
  ) => {
    try {
      const contract = new Contract(
        RECOMMENDATION_LOG_ADDRESS,
        RECOMMENDATION_LOG_ABI,
        provider
      );
      const total = await contract.totalRecommendations();
      if (total === 0n) return;

      const lastId = total - 1n;
      const rec = await contract.getRecommendation(lastId);
      if (rec.user.toLowerCase() !== owner.toLowerCase()) return;

      setLatestRisk({
        riskLevel: Number(rec.riskLevel),
        timestamp: Number(rec.timestamp)
      });
    } catch {
      // ignore if not deployed / wrong network
    }
  };

  const savePolicy = async () => {
    if (typeof window === "undefined") return;
    const anyWindow = window as any;
    if (!anyWindow.ethereum) {
      setStatus("No wallet found.");
      return;
    }
    setLoading(true);
    setStatus(null);
    try {
      const provider = new BrowserProvider(anyWindow.ethereum);
      const signer = await provider.getSigner();
      const contract = new Contract(
        POLICY_REGISTRY_ADDRESS,
        POLICY_REGISTRY_ABI,
        signer
      );
      const tx = await contract.setPolicy(
        BigInt(maxExposure),
        BigInt(maxLeverage),
        requireRecLog
      );
      setStatus("Submitting transaction...");
      await tx.wait();
      setStatus("Policy saved on Mantle.");
    } catch (err: any) {
      setStatus(err?.shortMessage ?? err?.message ?? "Failed to save policy.");
    } finally {
      setLoading(false);
    }
  };

  const getMockRecommendation = async () => {
    setAiLoading(true);
    setAiResponse(null);
    try {
      const res = await fetch("/api/mock-recommendation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          positionsDescription: aiText,
          intendedAction: aiAction
        })
      });
      if (!res.ok) throw new Error("Failed to get mock recommendation");
      const data = await res.json();
      setAiResponse(data);
    } catch (err) {
      console.error(err);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-6 md:p-12 lg:p-24 max-w-5xl mx-auto space-y-12">
      {/* HEADER SECTION */}
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
            An AI‑powered risk and strategy co‑pilot for Mantle. Set onchain guardrails
            that your future transactions must respect, and pair them with AI
            recommendations and explanations.
          </p>
        </div>
        
        <div className="flex flex-col gap-3 mt-6 md:mt-0 min-w-[200px]">
          <button className="button-primary w-full" onClick={connectWallet}>
            {account ? (
              <span className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                {account.slice(0, 6)}...{account.slice(-4)}
              </span>
            ) : (
              "Connect Mantle Wallet"
            )}
          </button>
          <a
            className="button-secondary w-full"
            href="https://docs.mantle.xyz"
            target="_blank"
            rel="noreferrer"
          >
            View Mantle Docs
          </a>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* POLICY COLUMN */}
        <div className="space-y-8">
          <section className="card p-6 md:p-8 space-y-6">
            <div>
              <h2 className="text-2xl font-semibold mb-2">Onchain Risk Policy</h2>
              <p className="text-sm text-slate-400">
                A minimal prototype of the <code className="text-emerald-400 bg-emerald-400/10 px-1 rounded">SentinelPolicyRegistry</code>. 
                These values are stored onchain to enforce vault guardrails.
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
                  onChange={(e) => setMaxExposure(e.target.value)}
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
                  onChange={(e) => setMaxLeverage(e.target.value)}
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
                  Require a recent AI recommendation log before allowing sensitive transactions.
                </span>
              </label>
            </div>

            <div className="pt-2">
              <button
                className="button-primary w-full"
                onClick={savePolicy}
                disabled={loading}
              >
                {loading ? "Saving to Mantle..." : "Save Policy Onchain"}
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
              <h2 className="text-xl font-semibold mb-2">Latest AI Snapshot</h2>
              <p className="text-sm text-slate-400">
                Reads from <code className="text-blue-400 bg-blue-400/10 px-1 rounded">SentinelRecommendationLog</code>.
              </p>
            </div>
            
            {latestRisk ? (
              <div className="p-4 rounded-lg bg-slate-800/40 border border-slate-700/50 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-200 mb-1">Current Evaluation</p>
                  <p className="text-xs text-slate-500">
                    {new Date(latestRisk.timestamp * 1000).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="badge badge-risk">Risk Level</span>
                  <span className="text-xl font-bold text-slate-200">{latestRisk.riskLevel}/5</span>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-lg bg-slate-800/20 border border-slate-700/50 border-dashed text-center">
                <p className="text-sm text-slate-500">
                  No AI recommendations logged for your address yet.
                </p>
              </div>
            )}
          </section>
        </div>

        {/* AI CO-PILOT COLUMN */}
        <div className="space-y-8">
          <section className="card p-6 md:p-8 space-y-6 h-full flex flex-col">
            <div>
              <h2 className="text-2xl font-semibold mb-2">AI Co‑Pilot Simulator</h2>
              <p className="text-sm text-slate-400">
                Test the offchain AI evaluation loop before it logs to the contract.
              </p>
            </div>

            <div className="space-y-4 flex-grow">
              <div>
                <label className="block text-sm font-medium mb-1.5 text-slate-200">
                  Current Position Context
                </label>
                <textarea
                  className="input resize-none"
                  rows={3}
                  value={aiText}
                  onChange={(e) => setAiText(e.target.value)}
                  placeholder="e.g. 50% stables in Mantle money market, 50% in blue-chip LP..."
                />
              </div>
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
              onClick={getMockRecommendation}
              disabled={aiLoading}
            >
              {aiLoading ? "Analyzing Strategy..." : "Run AI Risk Analysis"}
            </button>

            {aiResponse && (
              <div className="mt-4 p-5 rounded-lg bg-blue-900/10 border border-blue-500/20 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-center justify-between pb-3 border-b border-blue-500/10">
                  <span className="text-sm font-medium text-blue-200">Analysis Complete</span>
                  <div className="flex items-center gap-2">
                    <span className="badge badge-risk">Risk Score</span>
                    <span className="font-bold text-slate-200">{aiResponse.riskLevel}/5</span>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Explanation</p>
                  <p className="text-sm text-slate-300">{aiResponse.explanation}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Suggested Action</p>
                  <p className="text-sm text-slate-300">{aiResponse.suggestion}</p>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

