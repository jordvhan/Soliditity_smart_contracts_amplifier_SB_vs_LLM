const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ICO Contract", function () {
  let ICO, ico, UNLB, unlb, owner, addr1, addr2, addr3, addr4;

  beforeEach(async function () {
    [owner, addr1, addr2, addr3, addr4] = await ethers.getSigners();

    // Deploy UNLB token
    UNLB = await ethers.getContractFactory("UNLB");
    unlb = await UNLB.deploy();
    //await unlb.deployed();

    // Deploy ICO contract
    ICO = await ethers.getContractFactory("contracts/2018-13189.sol:ICO");
    ico = await ICO.deploy();
    //await ico.deployed();

    // Set the UNLB token in the ICO contract
    //await unlb.transferOwnership(ico.address);
  });

  it("Should calculate price per wei correctly", async function () {
    const price = await ico.pricePerWei();
    expect(price).to.be.a("bigint");
  });

  it("Should not allow withdrawal of funds by non-owner", async function () {
    await expect(ico.connect(addr1).withdraw()).to.be.reverted;
  });
});
