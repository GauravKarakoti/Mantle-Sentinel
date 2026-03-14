import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { ethers } from "ethers";

const client = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// Minimal ABI for the Recommendation Log contract
const logAbi = [
  "function recordRecommendation(address user, bytes32 inputHash, bytes32 summaryHash, uint8 riskLevel) external returns (uint256 id)"
];

export async function POST(req: NextRequest) {
  try {
    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        { error: "GROQ_API_KEY is not configured" },
        { status: 503 }
      );
    }

    const body = await req.json();
    const {
      positionsDescription: manualDescription,
      intendedAction,
      portfolio,
      userAddress // Make sure to pass the user's wallet address from the frontend
    } = body;

    const hasPortfolio = portfolio?.summary != null && String(portfolio.summary).trim() !== "";
    const extra = manualDescription != null && String(manualDescription).trim() !== "" ? `\n\n${manualDescription}` : "";
    const positionsDescription = hasPortfolio ? portfolio!.summary + extra : (manualDescription ?? "");

    const prompt = `
      You are an expert DeFi risk analyst for the Mantle network.
      Current User Positions: ${positionsDescription}
      Intended Action: ${intendedAction ?? ""}
      
      Analyze the risk of this action. Return a JSON object strictly matching this format:
      {
        "riskLevel": <number 1-5>,
        "explanation": "<brief explanation of the risk>",
        "suggestion": "<actionable advice based on the risk>"
      }
    `;

    const response = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    const content = response.choices?.[0]?.message?.content;
    if (!content) {
      return NextResponse.json({ error: "No response content from AI" }, { status: 500 });
    }

    const result = JSON.parse(content);

    // ==========================================
    // NEW: Automated Onchain Logging via Relayer
    // ==========================================
    let txHash = null;
    if (
      userAddress && 
      process.env.PRIVATE_KEY && 
      process.env.NEXT_PUBLIC_MANTLE_RPC_URL && 
      process.env.NEXT_PUBLIC_RECOMMENDATION_LOG_ADDRESS
    ) {
      try {
        const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_MANTLE_RPC_URL);
        const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
        const logContract = new ethers.Contract(process.env.NEXT_PUBLIC_RECOMMENDATION_LOG_ADDRESS, logAbi, wallet);

        // Hash the inputs and output for privacy
        const inputStr = positionsDescription + (intendedAction || "");
        const inputHash = ethers.id(inputStr.length > 0 ? inputStr : "empty-input");
        const summaryHash = ethers.id(result.explanation || "empty-summary");
        const riskLevel = Number(result.riskLevel) || 0;

        // Submit the transaction (we don't wait for it to mine to keep the API fast)
        const tx = await logContract.recordRecommendation(userAddress, inputHash, summaryHash, riskLevel);
        txHash = tx.hash;
        console.log("Automated recommendation logged. Tx Hash:", txHash);
      } catch (logError) {
        console.error("Failed to execute automated on-chain logging:", logError);
        // We don't throw here; we still want to return the AI recommendation to the user
      }
    }

    // Return the AI result along with the transaction hash of the log
    return NextResponse.json({ ...result, txHash });

  } catch (error) {
    console.error("AI Analysis Error:", error);
    return NextResponse.json(
      { error: "Failed to generate risk analysis" },
      { status: 500 }
    );
  }
}