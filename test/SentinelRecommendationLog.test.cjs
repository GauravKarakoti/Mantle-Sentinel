const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SentinelRecommendationLog", function () {
  let logContract;
  let owner, user;

  beforeEach(async function () {
    [owner, user] = await ethers.getSigners();
    const Log = await ethers.getContractFactory("SentinelRecommendationLog");
    logContract = await Log.deploy();
  });

  it("Should record a new recommendation successfully", async function () {
    const inputHash = ethers.id("mock-input");
    const summaryHash = ethers.id("mock-summary");
    const riskLevel = 3;

    // Execute the transaction
    const tx = await logContract.recordRecommendation(user.address, inputHash, summaryHash, riskLevel);
    
    // Check for emitted event
    await expect(tx)
      .to.emit(logContract, "RecommendationRecorded")
      .withArgs(0, user.address, inputHash, summaryHash, riskLevel, async (timestamp) => timestamp > 0);

    // Verify total recommendations count
    expect(await logContract.totalRecommendations()).to.equal(1);
  });

  it("Should reject invalid risk levels", async function () {
    const inputHash = ethers.id("mock-input");
    const summaryHash = ethers.id("mock-summary");
    const invalidRiskLevel = 6; // Contract requires <= 5

    await expect(
      logContract.recordRecommendation(user.address, inputHash, summaryHash, invalidRiskLevel)
    ).to.be.revertedWith("invalid risk");
  });

  it("Should retrieve a specific recommendation", async function () {
    const inputHash = ethers.id("mock-input");
    const summaryHash = ethers.id("mock-summary");
    
    await logContract.recordRecommendation(user.address, inputHash, summaryHash, 2);
    
    const rec = await logContract.getRecommendation(0);
    expect(rec.user).to.equal(user.address);
    expect(rec.riskLevel).to.equal(2);
  });
});