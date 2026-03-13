import hre from "hardhat";

/**
 * Simple helper script to write a dummy recommendation for a given user
 * into SentinelRecommendationLog, so the frontend "Latest AI Risk Snapshot"
 * card has something to display during demos.
 *
 * Usage:
 *   ADDRESS=0xYourWallet RECOMMENDATION_LOG_ADDRESS=0xLog npm run mock:recommendation
 */
async function main() {
  const user = process.env.ADDRESS;
  const logAddress = process.env.RECOMMENDATION_LOG_ADDRESS;

  if (!user || !logAddress) {
    throw new Error("ADDRESS and RECOMMENDATION_LOG_ADDRESS env vars are required.");
  }

  const [signer] = await hre.ethers.getSigners();
  console.log("Using signer:", signer.address);

  const RecommendationLog = await hre.ethers.getContractFactory(
    "SentinelRecommendationLog"
  );
  const log = RecommendationLog.attach(logAddress);

  const inputHash = hre.ethers.id("demo-input");
  const summaryHash = hre.ethers.id("demo-summary-low-risk");
  const riskLevel = 2; // demo: "Low/Medium"

  const tx = await log.recordRecommendation(user, inputHash, summaryHash, riskLevel);
  console.log("Submitting mock recommendation tx:", tx.hash);
  const receipt = await tx.wait();
  console.log("Mined in block:", receipt.blockNumber);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

