const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("DSPXToken and SpadePreSale", function () {
  let DSPXToken, SpadePreSale, dspxToken, spadePreSale;
  let owner, team, icoAgent, buyer, addr1, addr2;

  beforeEach(async function () {
    [owner, team, icoAgent, buyer, addr1, addr2] = await ethers.getSigners();

    // Deploy SpadePreSale contract
    const SpadePreSaleFactory = await ethers.getContractFactory("SpadePreSale");
    spadePreSale = await SpadePreSaleFactory.deploy(team.address, icoAgent.address);

    // Get DSPXToken instance from SpadePreSale
    const dspxTokenAddress = await spadePreSale.token();
    DSPXToken = await ethers.getContractAt("contracts/2018-13131.sol:DSPXToken", dspxTokenAddress);
  });

  it("Should deploy DSPXToken and SpadePreSale correctly", async function () {
    expect(await DSPXToken.name()).to.equal("SP8DE PreSale Token");
    expect(await DSPXToken.symbol()).to.equal("DSPX");
    expect(await DSPXToken.decimals()).to.equal(18);
    expect(await DSPXToken.totalSupply()).to.equal(0);
    expect(await DSPXToken.team()).to.equal(team.address);
  });

  it("Should mint tokens during pre-sale", async function () {
    await spadePreSale.connect(team).startPreSale();
    await spadePreSale.connect(icoAgent).buyPreSaleTokens(buyer.address, 1000, 1, "txHash1");
    expect(await DSPXToken.balanceOf(buyer.address)).to.equal(1000);
    expect(await DSPXToken.totalSupply()).to.equal(1000);
  });

  it("Should not mint tokens if pre-sale is not started", async function () {
    await expect(
      spadePreSale.connect(icoAgent).buyPreSaleTokens(buyer.address, 1000, 1, "txHash1")
    ).to.be.reverted;
  });

  it("Should allow token transfers after unfreezing", async function () {
    await spadePreSale.connect(team).startPreSale();
    await spadePreSale.connect(icoAgent).buyPreSaleTokens(buyer.address, 1000, 1, "txHash1");
    await DSPXToken.connect(team).unfreeze();
    await DSPXToken.connect(buyer).transfer(addr1.address, 500);
    expect(await DSPXToken.balanceOf(addr1.address)).to.equal(500);
    expect(await DSPXToken.balanceOf(buyer.address)).to.equal(500);
  });

  it("Should not allow token transfers while frozen", async function () {
    await spadePreSale.connect(team).startPreSale();
    await spadePreSale.connect(icoAgent).buyPreSaleTokens(buyer.address, 1000, 1, "txHash1");
    await expect(
      DSPXToken.connect(buyer).transfer(addr1.address, 500)
    ).to.be.reverted;
  });

  it("Should handle pre-sale state transitions correctly", async function () {
    expect(await spadePreSale.preSaleState()).to.equal(0); // Created
    await spadePreSale.connect(team).startPreSale();
    expect(await spadePreSale.preSaleState()).to.equal(1); // PreSaleStarted
    await spadePreSale.connect(team).pausePreSale();
    expect(await spadePreSale.isPaused()).to.be.true;
    await spadePreSale.connect(team).resumePreSale();
    expect(await spadePreSale.isPaused()).to.be.false;
    await spadePreSale.connect(team).finishPreSale();
    expect(await spadePreSale.preSaleState()).to.equal(2); // PreSaleFinished
  });

  it("Should not allow unauthorized actions", async function () {
    await expect(spadePreSale.connect(addr1).startPreSale()).to.be.reverted;
    await expect(spadePreSale.connect(addr1).pausePreSale()).to.be.reverted;
    await expect(spadePreSale.connect(addr1).resumePreSale()).to.be.reverted;
    await expect(spadePreSale.connect(addr1).finishPreSale()).to.be.reverted;
    await expect(DSPXToken.connect(addr1).unfreeze()).to.be.reverted;
  });

  it("Should respect token limit during minting", async function () {
    await spadePreSale.connect(team).startPreSale();
    const tokenLimit = await DSPXToken.TOKEN_LIMIT();
    await spadePreSale.connect(icoAgent).buyPreSaleTokens(buyer.address, tokenLimit, 1, "txHash1");
    await expect(
      spadePreSale.connect(icoAgent).buyPreSaleTokens(buyer.address, 1, 1, "txHash2")
    ).to.be.reverted;
  });

  it("Should not allow buying tokens after pre-sale is finished", async function () {
    await spadePreSale.connect(team).startPreSale();
    await spadePreSale.connect(team).finishPreSale();
    await expect(
      spadePreSale.connect(icoAgent).buyPreSaleTokens(buyer.address, 1000, 1, "txHash1")
    ).to.be.reverted;
  });

  it("Should not allow starting pre-sale if it has already started", async function () {
    await spadePreSale.connect(team).startPreSale();
    await expect(spadePreSale.connect(team).startPreSale()).to.be.reverted;
  });

  it("Should allow transfer after unfreezing", async function () {
    await spadePreSale.connect(team).startPreSale();
    await spadePreSale.connect(icoAgent).buyPreSaleTokens(buyer.address, 1000, 1, "txHash1");
    await DSPXToken.connect(team).unfreeze();
    await DSPXToken.connect(buyer).transfer(addr1.address, 100);
    expect(await DSPXToken.balanceOf(buyer.address)).to.equal(900);
    expect(await DSPXToken.balanceOf(addr1.address)).to.equal(100);
  });

  it("Should allow transferFrom after unfreezing", async function () {
    await spadePreSale.connect(team).startPreSale();
    await spadePreSale.connect(icoAgent).buyPreSaleTokens(buyer.address, 1000, 1, "txHash1");
    await DSPXToken.connect(team).unfreeze();
    await DSPXToken.connect(buyer).approve(addr1.address, 500);
    await DSPXToken.connect(addr1).transferFrom(buyer.address, addr2.address, 100);
    expect(await DSPXToken.balanceOf(buyer.address)).to.equal(900);
    expect(await DSPXToken.balanceOf(addr2.address)).to.equal(100);
    expect(await DSPXToken.allowance(buyer.address, addr1.address)).to.equal(400);
  });

  it("Should not allow approve when frozen", async function () {
    await spadePreSale.connect(team).startPreSale();
    await spadePreSale.connect(icoAgent).buyPreSaleTokens(buyer.address, 1000, 1, "txHash1");
    await expect(DSPXToken.connect(buyer).approve(addr1.address, 500)).to.be.reverted;
  });

  it("Should allow approve after unfreezing", async function () {
    await spadePreSale.connect(team).startPreSale();
    await spadePreSale.connect(icoAgent).buyPreSaleTokens(buyer.address, 1000, 1, "txHash1");
    await DSPXToken.connect(team).unfreeze();
    await DSPXToken.connect(buyer).approve(addr1.address, 500);
    expect(await DSPXToken.allowance(buyer.address, addr1.address)).to.equal(500);
  });

  it("Should not allow buying tokens when paused", async function () {
    await spadePreSale.connect(team).startPreSale();
    await spadePreSale.connect(team).pausePreSale();
    await expect(spadePreSale.connect(icoAgent).buyPreSaleTokens(buyer.address, 1000, 1, "txHash1")).to.be.reverted;
  });

  it("Should allow buying tokens after resuming from pause", async function () {
    await spadePreSale.connect(team).startPreSale();
    await spadePreSale.connect(team).pausePreSale();
    await spadePreSale.connect(team).resumePreSale();
    await spadePreSale.connect(icoAgent).buyPreSaleTokens(buyer.address, 1000, 1, "txHash1");
    expect(await DSPXToken.balanceOf(buyer.address)).to.equal(1000);
  });

  it("Should not allow minting zero tokens", async function () {
    await spadePreSale.connect(team).startPreSale();
    await expect(spadePreSale.connect(icoAgent).buyPreSaleTokens(buyer.address, 0, 1, "txHash1")).to.be.reverted;
  });

  it("Should not allow buying tokens with zero address", async function () {
    await spadePreSale.connect(team).startPreSale();
    await expect(spadePreSale.connect(icoAgent).buyPreSaleTokens(ethers.ZeroAddress, 1000, 1, "txHash1")).to.be.reverted;
  });
});
