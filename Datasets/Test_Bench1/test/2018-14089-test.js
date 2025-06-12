const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Virgo_ZodiacToken", function () {
  let owner, addr1, addr2, VirgoToken, token;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    const VirgoTokenFactory = await ethers.getContractFactory("Virgo_ZodiacToken");
    token = await VirgoTokenFactory.deploy();
  });

  it("Should deploy the contract and set the correct owner", async function () {
    expect(await token.runner.address).to.equal(owner.address);
  });

  it("Should allow the owner to enable and disable purchasing", async function () {
    await token.disablePurchasing();
    expect(await token.purchasingAllowed()).to.equal(false);

    await token.enablePurchasing();
    expect(await token.purchasingAllowed()).to.equal(true);
  });

  it("Should allow the owner to set parameters", async function () {
    await token.setAIRDROPBounce(100);
    expect(await token.AIRDROPBounce()).to.equal(100);

    await token.setICORatio(200);
    expect(await token.ICORatio()).to.equal(200);

    await token.setMINfinney(10);
    expect(await token.MINfinney()).to.equal(10);
  });
});
