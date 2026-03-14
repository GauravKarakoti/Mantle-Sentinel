import { NextRequest, NextResponse } from "next/server";
import { fetchPortfolio } from "@/lib/mantle-tokens";

const MANTLE_RPC =
  process.env.NEXT_PUBLIC_MANTLE_RPC_URL ?? "https://rpc.mantle.xyz";

export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get("address");
  if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return NextResponse.json(
      { error: "Valid address query parameter required" },
      { status: 400 }
    );
  }

  try {
    const portfolio = await fetchPortfolio(
      MANTLE_RPC,
      address,
      process.env.ALCHEMY_API_KEY
    );
    return NextResponse.json(portfolio);
  } catch (err) {
    console.error("Portfolio fetch error:", err);
    return NextResponse.json(
      { error: "Failed to fetch portfolio from Mantle" },
      { status: 500 }
    );
  }
}
