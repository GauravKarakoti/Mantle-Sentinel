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
    <div className="space-y-8">
      <section className="space-y-4">
        <div className="pill inline-flex items-center gap-2 px-4 py-1">
          <span className="badge">Concept</span>
          <span className="text-xs text-slate-200">
            Mantle + AI + onchain risk policies
          </span>
        </div>
        <h1 className="text-4xl md:text-5xl font-semibold tracking-tight">
          Mantle Sentinel
        </h1>
        <p className="text-slate-300 max-w-2xl">
          An AI‑powered risk and strategy co‑pilot for Mantle. Set onchain guardrails
          that your future transactions must respect, and pair them with AI
          recommendations and explanations.
        </p>
        <div className="flex gap-3 flex-wrap">
          <button className="button-primary" onClick={connectWallet}>
            {account ? "Wallet Connected" : "Connect Mantle Wallet"}
          </button>
          <a
            className="button-secondary"
            href="https://docs.mantle.xyz"
            target="_blank"
            rel="noreferrer"
          >
            View Mantle Docs
          </a>
        </div>
        {account && (
          <p className="text-xs text-slate-400">
            Connected as {account.slice(0, 6)}...{account.slice(-4)}
          </p>
        )}
      </section>

      <section className="card p-6 space-y-4">
        <h2 className="text-xl font-semibold">Your Onchain Risk Policy</h2>
        <p className="text-sm text-slate-300">
          This is a minimal prototype of the{" "}
          <code>SentinelPolicyRegistry</code> UX. Values are stored onchain and
          can be enforced by DAO/vault guard contracts and paired with AI
          recommendations.
        </p>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold mb-1 text-slate-300">
              Max protocol exposure (basis points)
            </label>
            <input
              className="input"
              type="number"
              min={0}
              max={10000}
              value={maxExposure}
              onChange={(e) => setMaxExposure(e.target.value)}
            />
            <p className="mt-1 text-xs text-slate-400">
              2000 = 20% exposure cap to any single protocol.
            </p>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1 text-slate-300">
              Max leverage (basis points)
            </label>
            <input
              className="input"
              type="number"
              min={10000}
              value={maxLeverage}
              onChange={(e) => setMaxLeverage(e.target.value)}
            />
            <p className="mt-1 text-xs text-slate-400">
              30000 = 3x leverage cap across your positions.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <input
            id="requireRec"
            type="checkbox"
            checked={requireRecLog}
            onChange={(e) => setRequireRecLog(e.target.checked)}
          />
          <label
            htmlFor="requireRec"
            className="text-sm text-slate-200 cursor-pointer"
          >
            Require a recent AI recommendation log before sensitive actions
          </label>
        </div>
        <div className="flex items-center gap-3 mt-4">
          <button
            className="button-primary"
            onClick={savePolicy}
            disabled={loading}
          >
            {loading ? "Saving..." : "Save Policy to Mantle"}
          </button>
          {status && (
            <p className="text-xs text-slate-300 max-w-sm">{status}</p>
          )}
        </div>
      </section>

      <section className="card p-6 space-y-3">
        <h2 className="text-xl font-semibold">Latest AI Risk Snapshot (demo)</h2>
        <p className="text-sm text-slate-300">
          This reads from the <code>SentinelRecommendationLog</code> contract. An
          offchain AI agent can log hashed recommendations there whenever it
          evaluates your positions or a pending transaction.
        </p>
        {latestRisk ? (
          <div className="text-sm text-slate-200 space-y-1">
            <p>
              <span className="badge mr-2">Risk Level</span>
              {latestRisk.riskLevel} / 5
            </p>
            <p className="text-xs text-slate-400">
              Last updated:{" "}
              {new Date(latestRisk.timestamp * 1000).toLocaleString()}
            </p>
          </div>
        ) : (
          <p className="text-xs text-slate-400">
            No AI recommendations found yet for your address on this network. In
            a full deployment, an AI backend would periodically write to the log
            as it reviews your Mantle activity.
          </p>
        )}
      </section>

      <section className="card p-6 space-y-4">
        <h2 className="text-xl font-semibold">Ask the (Mock) AI Co‑Pilot</h2>
        <p className="text-sm text-slate-300">
          This endpoint simulates how an AI service would reason about your
          Mantle positions and a pending action, then return a risk level,
          explanation, and suggestion. It currently uses simple heuristics so
          you can demo the flow without a real model.
        </p>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold mb-1 text-slate-300">
              Describe your current positions
            </label>
            <textarea
              className="input"
              rows={4}
              value={aiText}
              onChange={(e) => setAiText(e.target.value)}
              placeholder="e.g. 50% stables in Mantle money market, 50% in blue-chip LP..."
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1 text-slate-300">
              Describe your intended action
            </label>
            <textarea
              className="input"
              rows={4}
              value={aiAction}
              onChange={(e) => setAiAction(e.target.value)}
              placeholder="e.g. open 3x leveraged long on volatile asset, move all collateral..."
            />
          </div>
        </div>
        <button
          className="button-primary"
          onClick={getMockRecommendation}
          disabled={aiLoading}
        >
          {aiLoading ? "Thinking..." : "Get Mock AI Recommendation"}
        </button>
        {aiResponse && (
          <div className="mt-3 space-y-2 text-sm text-slate-200">
            <p>
              <span className="badge mr-2">Risk Level</span>
              {aiResponse.riskLevel} / 5
            </p>
            <p className="text-xs text-slate-300">{aiResponse.explanation}</p>
            <p className="text-xs text-slate-300">{aiResponse.suggestion}</p>
          </div>
        )}
      </section>

      <section className="text-xs text-slate-500 space-y-2">
        <p>
          This UI is a demo surface for the bounty: in a full build, an AI
          backend would read your onchain positions, generate risk summaries and
          strategy suggestions, and log hashed recommendations to the{" "}
          <code>SentinelRecommendationLog</code> contract before you execute
          key actions.
        </p>
      </section>
    </div>
  );
}

