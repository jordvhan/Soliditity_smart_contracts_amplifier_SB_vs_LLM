const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SwftCoin Contract", function () {
  let SwftCoin, swftCoin, owner, addr1, addr2;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    const initialSupply = 1000;
    const tokenName = "SwftCoin";
    const decimalUnits = 18;
    const tokenSymbol = "SWFT";

    SwftCoin = await ethers.getContractFactory("SwftCoin");
    swftCoin = await SwftCoin.deploy(initialSupply, tokenName, decimalUnits, tokenSymbol);
  });

  it("Should deploy with correct initial values", async function () {
    expect(await swftCoin.name()).to.equal("SwftCoin");
    expect(await swftCoin.symbol()).to.equal("SWFT");
    expect(await swftCoin.totalSupply()).to.equal(1000);
    expect(await swftCoin.balanceOf(owner.address)).to.equal(1000);
  });

  it("Should transfer ownership", async function () {
    await swftCoin.transferOwnership(addr1.address);
    expect(await swftCoin.owner()).to.equal(addr1.address);
  });

  it("Should transfer tokens between accounts", async function () {
    await swftCoin.transfer(addr1.address, 100);
    expect(await swftCoin.balanceOf(owner.address)).to.equal(900);
    expect(await swftCoin.balanceOf(addr1.address)).to.equal(100);
  });

  it("Should not allow transfer if sender has insufficient balance", async function () {
    await expect(swftCoin.connect(addr1).transfer(addr2.address, 100)).to.be.reverted;
  });

  it("Should mint new tokens", async function () {
    await swftCoin.mintToken(addr1.address, 500);
    expect(await swftCoin.totalSupply()).to.equal(1500);
    expect(await swftCoin.balanceOf(addr1.address)).to.equal(500);
  });

  it("Should freeze and unfreeze accounts", async function () {
    await swftCoin.freezeAccount(addr1.address, true);
    await expect(swftCoin.connect(addr1).transfer(addr2.address, 100)).to.be.reverted;

    await swftCoin.freezeAccount(addr1.address, false);
    await swftCoin.transfer(addr1.address, 100);
    await swftCoin.connect(addr1).transfer(addr2.address, 50);
    expect(await swftCoin.balanceOf(addr2.address)).to.equal(50);
  });

  it("Should set buy and sell prices", async function () {
    await swftCoin.setPrices(ethers.parseEther("0.01"), ethers.parseEther("0.02"));
    expect(await swftCoin.sellPrice()).to.equal(ethers.parseEther("0.01"));
    expect(await swftCoin.buyPrice()).to.equal(ethers.parseEther("0.02"));
  });

  it("Should not allow buying if contract has insufficient tokens", async function () {
    await swftCoin.setPrices(ethers.parseEther("0.01"), ethers.parseEther("0.02"));
    await expect(swftCoin.connect(addr1).buy({ value: ethers.parseEther("0.1") })).to.be.reverted;
  });

  it("Should not allow selling if sender has insufficient tokens", async function () {
    await swftCoin.setPrices(ethers.parseEther("0.01"), ethers.parseEther("0.02"));
    await expect(swftCoin.connect(addr1).sell(50)).to.be.reverted;
  });
});
