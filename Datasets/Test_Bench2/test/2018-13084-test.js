const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("GoodTimeCoin", function () {
  let owner, addr1, addr2, GoodTimeCoin, goodTimeCoin;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    const initialSupply = ethers.parseEther("1000");
    GoodTimeCoin = await ethers.getContractFactory("GoodTimeCoin");
    goodTimeCoin = await GoodTimeCoin.deploy(initialSupply, "GoodTimeCoin", "GTC");
    await goodTimeCoin.waitForDeployment();
  });

  it("Should set the correct owner", async function () {
    expect(await goodTimeCoin.owner()).to.equal(owner.address);
  });

  it("Should transfer ownership", async function () {
    await goodTimeCoin.transferOwnership(addr1.address);
    expect(await goodTimeCoin.owner()).to.equal(addr1.address);
    // Transfer back to original owner for subsequent tests
    await goodTimeCoin.connect(addr1).transferOwnership(owner.address);
    expect(await goodTimeCoin.owner()).to.equal(owner.address);
  });

  it("Should fail transfer ownership if not owner", async function () {
    await expect(goodTimeCoin.connect(addr1).transferOwnership(addr2.address))
      .to.be.reverted;
  });

  it("Should transfer tokens", async function () {
    await goodTimeCoin.transfer(addr1.address, ethers.parseEther("100"));
    expect(await goodTimeCoin.balanceOf(addr1.address)).to.equal(ethers.parseEther("100"));
  });

  it("Should fail transfer tokens if balance is insufficient", async function () {
    await expect(goodTimeCoin.connect(addr1).transfer(addr2.address, ethers.parseEther("100")))
      .to.be.reverted;
  });

  it("Should approve and transferFrom tokens", async function () {
    await goodTimeCoin.approve(addr1.address, ethers.parseEther("50"));
    expect(await goodTimeCoin.allowance(owner.address, addr1.address)).to.equal(ethers.parseEther("50"));
    await goodTimeCoin.connect(addr1).transferFrom(owner.address, addr2.address, ethers.parseEther("50"));
    expect(await goodTimeCoin.balanceOf(addr2.address)).to.equal(ethers.parseEther("50"));
  });

  it("Should fail transferFrom if allowance is insufficient", async function () {
    await goodTimeCoin.approve(addr1.address, ethers.parseEther("20"));
    await expect(goodTimeCoin.connect(addr1).transferFrom(owner.address, addr2.address, ethers.parseEther("50")))
      .to.be.reverted;
  });

  it("Should mint tokens", async function () {
    await goodTimeCoin.mintToken(addr1.address, ethers.parseEther("200"));
    expect(await goodTimeCoin.balanceOf(addr1.address)).to.equal(ethers.parseEther("200"));
  });

  it("Should fail mint tokens if not owner", async function () {
    await expect(goodTimeCoin.connect(addr1).mintToken(addr2.address, ethers.parseEther("100")))
      .to.be.reverted;
  });

  it("Should freeze and unfreeze accounts", async function () {
    await goodTimeCoin.freezeAccount(addr1.address, true);
    expect(await goodTimeCoin.frozenAccount(addr1.address)).to.equal(true);
    await goodTimeCoin.freezeAccount(addr1.address, false);
    expect(await goodTimeCoin.frozenAccount(addr1.address)).to.equal(false);
  });

  it("Should fail freeze account if not owner", async function () {
    await expect(goodTimeCoin.connect(addr1).freezeAccount(addr2.address, true))
      .to.be.reverted;
  });

  it("Should set buy and sell prices", async function () {
    await goodTimeCoin.setPrices(ethers.parseEther("0.01"), ethers.parseEther("0.02"));
    expect(await goodTimeCoin.sellPrice()).to.equal(ethers.parseEther("0.01"));
    expect(await goodTimeCoin.buyPrice()).to.equal(ethers.parseEther("0.02"));
  });

  it("Should fail set prices if not owner", async function () {
    await expect(goodTimeCoin.connect(addr1).setPrices(ethers.parseEther("0.01"), ethers.parseEther("0.02")))
      .to.be.reverted;
  });

  it("Should fail burn tokens if balance is insufficient", async function () {
    await expect(goodTimeCoin.connect(addr1).burn(ethers.parseEther("100")))
      .to.be.reverted;
  });

  it("Should fail burnFrom if allowance is insufficient", async function () {
    await goodTimeCoin.approve(addr1.address, ethers.parseEther("20"));
    await expect(goodTimeCoin.connect(addr1).burnFrom(owner.address, ethers.parseEther("50")))
      .to.be.reverted;
  });

  it("Should fail burnFrom if balance is insufficient", async function () {
    await goodTimeCoin.transfer(addr1.address, ethers.parseEther("10"));
    await goodTimeCoin.approve(addr1.address, ethers.parseEther("50"));
    await expect(goodTimeCoin.connect(addr1).burnFrom(owner.address, ethers.parseEther("1000")))
      .to.be.reverted;
  });

  it("Should fail sell tokens if contract balance is insufficient", async function () {
    await goodTimeCoin.setPrices(ethers.parseEther("1"), ethers.parseEther("2"));
    await goodTimeCoin.transfer(addr1.address, ethers.parseEther("100"));
    const amountToSell = ethers.parseEther("100");
    await goodTimeCoin.connect(addr1).approve(goodTimeCoin.target, amountToSell);
    await expect(goodTimeCoin.connect(addr1).sell(amountToSell)).to.be.reverted;
  });

  it("Should fail sell tokens if user balance is insufficient", async function () {
    await goodTimeCoin.setPrices(ethers.parseEther("0.01"), ethers.parseEther("0.02"));
    const amountToSell = ethers.parseEther("1000");
    await goodTimeCoin.approve(goodTimeCoin.target, amountToSell);
    await expect(goodTimeCoin.connect(owner).sell(amountToSell)).to.be.reverted;
  });
});
