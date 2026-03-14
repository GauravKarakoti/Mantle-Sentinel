import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

const client = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

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
    } = body;

    // Prefer on-chain portfolio data when provided (reduces friction and prevents user from lying)
    const hasPortfolio = portfolio?.summary != null && String(portfolio.summary).trim() !== "";
    const extra = manualDescription != null && String(manualDescription).trim() !== "" ? `\n\n${manualDescription}` : "";
    const positionsDescription = hasPortfolio ? portfolio!.summary + extra : (manualDescription ?? "");

    const prompt = `
      You are an expert DeFi risk analyst for the Mantle network.
      Current User Positions (on-chain data when available): ${positionsDescription}
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
      console.error("Groq returned no content:", response);
      return NextResponse.json(
        { error: "No response content from AI" },
        { status: 500 }
      );
    }

    const result = JSON.parse(content);
    return NextResponse.json(result);
  } catch (error) {
    console.error("AI Analysis Error:", error);
    return NextResponse.json(
      { error: "Failed to generate risk analysis" },
      { status: 500 }
    );
  }
}