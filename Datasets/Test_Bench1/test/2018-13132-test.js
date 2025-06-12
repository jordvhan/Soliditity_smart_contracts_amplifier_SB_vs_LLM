const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SPXToken and SpadeIco", function () {
  let SPXToken, spxToken, SpadeIco, spadeIco;
  let owner, team, icoAgent, migrationMaster, foundation, other, buyer;

  beforeEach(async function () {
    [owner, team, icoAgent, migrationMaster, foundation, other, buyer] = await ethers.getSigners();

    // Deploy SPXToken
    SPXToken = await ethers.getContractFactory("contracts/2018-13132.sol:SPXToken");
    spxToken = await SPXToken.deploy(icoAgent.address, migrationMaster.address);

    // Deploy SpadeIco
    SpadeIco = await ethers.getContractFactory("SpadeIco");
    spadeIco = await SpadeIco.deploy(team.address, icoAgent.address, migrationMaster.address);
  });

  describe("SPXToken", function () {
    it("should mint tokens correctly", async function () {
      await spxToken.connect(icoAgent).mint(buyer.address, ethers.parseEther("100"));
      expect(await spxToken.balanceOf(buyer.address)).to.equal(ethers.parseEther("100"));
    });

    it("should not allow minting beyond the token limit", async function () {
      const tokenLimit = await spxToken.TOKEN_LIMIT();
      await expect(spxToken.connect(icoAgent).mint(buyer.address, tokenLimit+1n)).to.be.reverted;
    });

    it("should allow unfreezing of tokens", async function () {
      await spxToken.connect(icoAgent).unfreeze();
      expect(await spxToken.isFrozen()).to.be.false;
    });

    it("should allow token transfers when unfrozen", async function () {
      await spxToken.connect(icoAgent).mint(buyer.address, ethers.parseEther("100"));
      await spxToken.connect(icoAgent).unfreeze();
      await spxToken.connect(buyer).transfer(other.address, ethers.parseEther("50"));
      expect(await spxToken.balanceOf(other.address)).to.equal(ethers.parseEther("50"));
    });

    it("should not allow token transfers when frozen", async function () {
      await spxToken.connect(icoAgent).mint(buyer.address, ethers.parseEther("100"));
      await expect(spxToken.connect(buyer).transfer(other.address, ethers.parseEther("50"))).to.be.reverted;
    });
  });

  describe("SpadeIco", function () {
    it("should start the ICO", async function () {
      await spadeIco.connect(team).startIco();
      expect(await spadeIco.icoState()).to.equal(1); // IcoStarted
    });

    it("should pause and resume the ICO", async function () {
      await spadeIco.connect(team).startIco();
      await spadeIco.connect(team).pauseIco();
      expect(await spadeIco.isPaused()).to.be.true;

      await spadeIco.connect(team).resumeIco();
      expect(await spadeIco.isPaused()).to.be.false;
    });

    it("should not allow token purchases when ICO is paused", async function () {
      await spadeIco.connect(team).startIco();
      await spadeIco.connect(team).pauseIco();
      await expect(spadeIco.connect(icoAgent).buyTokens(buyer.address, ethers.parseEther("100"), 1, "txHash")).to.be.reverted;
    });

  });
});
