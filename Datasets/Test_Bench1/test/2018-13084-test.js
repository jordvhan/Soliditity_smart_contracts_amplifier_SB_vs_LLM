const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("GoodTimeCoin", function () {
  let owner, addr1, addr2, GoodTimeCoin, goodTimeCoin;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    const initialSupply = ethers.parseEther("1000");
    GoodTimeCoin = await ethers.getContractFactory("GoodTimeCoin");
    goodTimeCoin = await GoodTimeCoin.deploy(initialSupply, "GoodTimeCoin", "GTC");
  });

  it("Should set the correct owner", async function () {
    expect(await goodTimeCoin.owner()).to.equal(owner.address);
  });

  it("Should transfer ownership", async function () {
    await goodTimeCoin.transferOwnership(addr1.address);
    expect(await goodTimeCoin.owner()).to.equal(addr1.address);
  });

  it("Should transfer tokens", async function () {
    await goodTimeCoin.transfer(addr1.address, ethers.parseEther("100"));
    expect(await goodTimeCoin.balanceOf(addr1.address)).to.equal(ethers.parseEther("100"));
  });

  it("Should approve and transferFrom tokens", async function () {
    await goodTimeCoin.approve(addr1.address, ethers.parseEther("50"));
    await goodTimeCoin.connect(addr1).transferFrom(owner.address, addr2.address, ethers.parseEther("50"));
    expect(await goodTimeCoin.balanceOf(addr2.address)).to.equal(ethers.parseEther("50"));
  });

  it("Should mint tokens", async function () {
    await goodTimeCoin.mintToken(addr1.address, ethers.parseEther("200"));
    expect(await goodTimeCoin.balanceOf(addr1.address)).to.equal(ethers.parseEther("200"));
  });

  it("Should freeze and unfreeze accounts", async function () {
    await goodTimeCoin.freezeAccount(addr1.address, true);
    expect(await goodTimeCoin.frozenAccount(addr1.address)).to.equal(true);
    await goodTimeCoin.freezeAccount(addr1.address, false);
    expect(await goodTimeCoin.frozenAccount(addr1.address)).to.equal(false);
  });

  it("Should set buy and sell prices", async function () {
    await goodTimeCoin.setPrices(ethers.parseEther("0.01"), ethers.parseEther("0.02"));
    expect(await goodTimeCoin.sellPrice()).to.equal(ethers.parseEther("0.01"));
    expect(await goodTimeCoin.buyPrice()).to.equal(ethers.parseEther("0.02"));
  });

  it("Should burn tokens", async function () {
    await goodTimeCoin.burn(ethers.parseEther("100000000000000000000"));
    expect(await goodTimeCoin.totalSupply()).to.equal(ethers.parseEther("900000000000000000000"));
  });

  it("Should burn tokens from another account", async function () {
    await goodTimeCoin.approve(addr1.address, ethers.parseEther("50000000000000000000"));
    await goodTimeCoin.connect(addr1).burnFrom(owner.address, ethers.parseEther("50000000000000000000"));
    expect(await goodTimeCoin.totalSupply()).to.equal(ethers.parseEther("950000000000000000000"));
  });
});
