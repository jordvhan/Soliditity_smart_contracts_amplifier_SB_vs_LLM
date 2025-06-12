const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("YiTongCoin Contract", function () {
  let owner, addr1, addr2, token;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    const YiTongCoin = await ethers.getContractFactory("YiTongCoin");
    token = await YiTongCoin.deploy(
      ethers.parseEther("1000"), // initial supply
      "YiTongCoin",             // token name
      "YTC"                     // token symbol
    );
  });

  it("Should initialize with correct values", async function () {
    expect(await token.name()).to.equal("YiTongCoin");
    expect(await token.symbol()).to.equal("YTC");
    expect(await token.totalSupply()).to.equal(ethers.parseEther("1000000000000000000000"));
    expect(await token.balanceOf(owner.address)).to.equal(ethers.parseEther("1000000000000000000000"));
  });

  it("Should transfer tokens correctly", async function () {
    await token.transfer(addr1.address, ethers.parseEther("100000000000000000000"));
    expect(await token.balanceOf(addr1.address)).to.equal(ethers.parseEther("100000000000000000000"));
    expect(await token.balanceOf(owner.address)).to.equal(ethers.parseEther("900000000000000000000"));
  });

  it("Should fail transfer if balance is insufficient", async function () {
    await expect(token.connect(addr1).transfer(addr2.address, ethers.parseEther("1"))).to.be.reverted;
  });

  it("Should allow owner to mint tokens", async function () {
    await token.mintToken(addr1.address, ethers.parseEther("500000000000000000000"));
    expect(await token.totalSupply()).to.equal(ethers.parseEther("1500000000000000000000"));
    expect(await token.balanceOf(addr1.address)).to.equal(ethers.parseEther("500000000000000000000"));
  });

  it("Should allow owner to freeze and unfreeze accounts", async function () {
    await token.freezeAccount(addr1.address, true);
    await expect(token.connect(addr1).transfer(addr2.address, ethers.parseEther("1"))).to.be.reverted;
    await token.freezeAccount(addr1.address, false);
    await token.transfer(addr1.address, ethers.parseEther("100"));
    await token.connect(addr1).transfer(addr2.address, ethers.parseEther("50"));
    expect(await token.balanceOf(addr2.address)).to.equal(ethers.parseEther("50"));
  });

  it("Should allow setting buy and sell prices", async function () {
    await token.setPrices(ethers.parseEther("0.01"), ethers.parseEther("0.02"));
    expect(await token.sellPrice()).to.equal(ethers.parseEther("0.01"));
    expect(await token.buyPrice()).to.equal(ethers.parseEther("0.02"));
  });

  it("Should burn tokens correctly", async function () {
    await token.burn(ethers.parseEther("100000000000000000000"));
    expect(await token.totalSupply()).to.equal(ethers.parseEther("900000000000000000000"));
    expect(await token.balanceOf(owner.address)).to.equal(ethers.parseEther("900000000000000000000"));
  });

  it("Should burn tokens from another account", async function () {
    await token.transfer(addr1.address, ethers.parseEther("100000000000000000000"));
    await token.connect(addr1).approve(owner.address, ethers.parseEther("50000000000000000000"));
    await token.burnFrom(addr1.address, ethers.parseEther("50000000000000000000"));
    expect(await token.totalSupply()).to.equal(ethers.parseEther("950000000000000000000"));
    expect(await token.balanceOf(addr1.address)).to.equal(ethers.parseEther("50000000000000000000"));
  });
});
