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

    it("should allow approve and transferFrom when unfrozen", async function () {
      await spxToken.connect(icoAgent).mint(owner.address, ethers.parseEther("100"));
      await spxToken.connect(icoAgent).unfreeze();
      await spxToken.approve(buyer.address, ethers.parseEther("50"));
      await spxToken.connect(buyer).transferFrom(owner.address, other.address, ethers.parseEther("50"));
      expect(await spxToken.balanceOf(other.address)).to.equal(ethers.parseEther("50"));
    });

    it("should not allow approve when frozen", async function () {
      await spxToken.connect(icoAgent).mint(owner.address, ethers.parseEther("100"));
      await expect(spxToken.approve(buyer.address, ethers.parseEther("50"))).to.be.reverted;
    });

    it("should not allow migration when migrationAgent is not set", async function () {
      await spxToken.connect(icoAgent).mint(owner.address, ethers.parseEther("100"));
      await expect(spxToken.migrate(ethers.parseEther("50"))).to.be.reverted;
    });

    it("should set migration agent only by migration master", async function () {
      await expect(spxToken.connect(buyer).setMigrationAgent(other.address)).to.be.reverted;
      await spxToken.connect(migrationMaster).setMigrationAgent(other.address);
      expect(await spxToken.migrationAgent()).to.equal(other.address);
    });

    it("should set migration master only by migration master", async function () {
        await expect(spxToken.connect(buyer).setMigrationMaster(other.address)).to.be.reverted;
        await spxToken.connect(migrationMaster).setMigrationMaster(other.address);
        expect(await spxToken.migrationMaster()).to.equal(other.address);
    });

    it("should not allow setting migration master to zero address", async function () {
        await expect(spxToken.connect(migrationMaster).setMigrationMaster(ethers.ZeroAddress)).to.be.reverted;
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

    it("should finish the ICO", async function () {
      await spadeIco.connect(team).startIco();
      await spadeIco.connect(team).finishIco(foundation.address, other.address);
      expect(await spadeIco.icoState()).to.equal(2); // IcoFinished
    });

    it("should not allow actions if not in IcoStarted state", async function () {
      await expect(spadeIco.connect(icoAgent).buyTokens(buyer.address, ethers.parseEther("100"), 1, "txHash")).to.be.reverted;
      await expect(spadeIco.connect(icoAgent).convertPresaleTokens(buyer.address, ethers.parseEther("100"), 1, "txHash")).to.be.reverted;
      await expect(spadeIco.connect(icoAgent).creditJackpotTokens(buyer.address, ethers.parseEther("100"), 1)).to.be.reverted;
    });

    it("should not allow starting ICO if already started", async function () {
      await spadeIco.connect(team).startIco();
      await expect(spadeIco.connect(team).startIco()).to.be.reverted;
    });

    it("should not allow pausing ICO if not started", async function () {
      await expect(spadeIco.connect(team).pauseIco()).to.be.reverted;
    });

    it("should not allow resuming ICO if not paused", async function () {
      await expect(spadeIco.connect(team).resumeIco()).to.be.reverted;
    });

    it("should not allow finishing ICO if not started", async function () {
      await expect(spadeIco.connect(team).finishIco(foundation.address, other.address)).to.be.reverted;
    });

    it("should not allow finishing ICO with zero address", async function () {
      await spadeIco.connect(team).startIco();
      await expect(spadeIco.connect(team).finishIco(ethers.ZeroAddress, other.address)).to.be.reverted;
      await expect(spadeIco.connect(team).finishIco(foundation.address, ethers.ZeroAddress)).to.be.reverted;
    });

    it("should not allow buying more tokens than available", async function () {
      await spadeIco.connect(team).startIco();
      const maxTokens = await spadeIco.TOKENS_FOR_SALE();
      await expect(spadeIco.connect(icoAgent).buyTokens(buyer.address, maxTokens + 1n, 1, "txHash")).to.be.reverted;
    });

    it("should emit events correctly", async function () {
      await spadeIco.connect(team).startIco();
      await expect(spadeIco.connect(icoAgent).buyTokens(buyer.address, ethers.parseEther("100"), 1, "txHash"))
        .to.emit(spadeIco, "TokenBuy")
        .withArgs(buyer.address, ethers.parseEther("100"), 1, "txHash");

      await expect(spadeIco.connect(icoAgent).convertPresaleTokens(buyer.address, ethers.parseEther("100"), 1, "txHash"))
        .to.emit(spadeIco, "TokenBuyPresale")
        .withArgs(buyer.address, ethers.parseEther("100"), 1, "txHash");

      await expect(spadeIco.connect(icoAgent).creditJackpotTokens(buyer.address, ethers.parseEther("100"), 1))
        .to.emit(spadeIco, "TokenWin")
        .withArgs(buyer.address, ethers.parseEther("100"), 1);
    });
  });
});
