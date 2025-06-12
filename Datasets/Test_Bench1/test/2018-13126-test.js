const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MoxyOnePresale and SpendToken", function () {
  let SpendToken, MoxyOnePresale, presale, token, owner, addr1, addr2;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    // Deploy the presale contract
    const Presale = await ethers.getContractFactory("MoxyOnePresale");
    presale = await Presale.deploy();
    //await presale.deployed();

    // Get the token contract instance
    token = await ethers.getContractAt("SpendToken", await presale.token());
  });

  it("Should initialize the presale and token contracts correctly", async function () {
    expect(await presale.team()).to.equal(owner.address);
    //expect(await token.presale()).to.equal(presale.address);
    expect(await token.team()).to.equal(owner.address);
  });

  it("Should allow the team to pause and resume the presale", async function () {
    await presale.pausePreSale();
    expect(await presale.isPaused()).to.be.true;

    await presale.resumePreSale();
    expect(await presale.isPaused()).to.be.false;
  });

  it("Should allow the team to finish the presale", async function () {
    await presale.finishPreSale();
    expect(await presale.preSaleState()).to.equal(1); // PreSaleFinished
  });

  it("Should not allow non-team members to pause, resume, or finish the presale", async function () {
    await expect(presale.connect(addr1).pausePreSale()).to.be.reverted;
    await expect(presale.connect(addr1).resumePreSale()).to.be.reverted;
    await expect(presale.connect(addr1).finishPreSale()).to.be.reverted;
  });

  it("Should not allow minting tokens by non-presale addresses", async function () {
    await expect(token.connect(addr1).mint(addr1.address, 1000)).to.be.reverted;
  });
});
