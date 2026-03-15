import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { ethers } from "ethers";

const client = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// Updated ABI to match the new contract structure
const logAbi = [
  "function recordRecommendation(address user, string title, string evaluation, uint8 riskLevel) external returns (uint256 id)"
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
      userAddress
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
        "title": "<A short 3-5 word title summarizing the action>",
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

        // Format evaluation string
        const evaluationStr = `Explanation: ${result.explanation}\n\nSuggestion: ${result.suggestion}`;
        const riskLevel = Number(result.riskLevel) || 0;
        const title = result.title || "Risk Evaluation";

        // Submit the transaction
        const tx = await logContract.recordRecommendation(userAddress, title, evaluationStr, riskLevel);
        txHash = tx.hash;
        console.log("Automated recommendation logged. Tx Hash:", txHash);
      } catch (logError) {
        console.error("Failed to execute automated on-chain logging:", logError);
      }
    }

    return NextResponse.json({ ...result, txHash });

  } catch (error) {
    console.error("AI Analysis Error:", error);
    return NextResponse.json(
      { error: "Failed to generate risk analysis" },
      { status: 500 }
    );
  }
}