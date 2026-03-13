const hre = require("hardhat");

async function main() {
  const PolicyRegistry = await hre.ethers.getContractFactory("SentinelPolicyRegistry");
  const policyRegistry = await PolicyRegistry.deploy();
  await policyRegistry.waitForDeployment();
  console.log(
    "SentinelPolicyRegistry deployed to:",
    await policyRegistry.getAddress()
  );

  const RecommendationLog = await hre.ethers.getContractFactory(
    "SentinelRecommendationLog"
  );
  const recommendationLog = await RecommendationLog.deploy();
  await recommendationLog.waitForDeployment();
  console.log(
    "SentinelRecommendationLog deployed to:",
    await recommendationLog.getAddress()
  );

  const Guard = await hre.ethers.getContractFactory("SentinelGuard");
  const guard = await Guard.deploy(await policyRegistry.getAddress());
  await guard.waitForDeployment();
  console.log("SentinelGuard deployed to:", await guard.getAddress());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });