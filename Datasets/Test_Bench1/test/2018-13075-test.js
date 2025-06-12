const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CarbonExchangeCoinToken", function () {
  let owner, addr1, addr2, token;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    const Token = await ethers.getContractFactory("CarbonExchangeCoinToken");
    token = await Token.deploy();
  });

  it("should initialize with correct values", async function () {
    expect(await token.totalSupply()).to.equal(ethers.parseEther("50000000000"));
    expect(await token.balanceOf(owner.address)).to.equal(ethers.parseEther("50000000000"));
    expect(await token.tokenName()).to.equal("Carbon Exchange Coin Token");
    expect(await token.tokenSymbol()).to.equal("CEC");
  });

  it("should transfer tokens correctly", async function () {
    await token.transfer(addr1.address, ethers.parseEther("100"));
    expect(await token.balanceOf(addr1.address)).to.equal(ethers.parseEther("100"));
    expect(await token.balanceOf(owner.address)).to.equal(ethers.parseEther("49999999900"));
  });

  it("should not allow transfer to zero address", async function () {
    const AddressZero = "0x0000000000000000000000000000000000000000";
    await expect(token.transfer(AddressZero, ethers.parseEther("100"))).to.be.reverted;
  });

  it("should allow owner to mint tokens", async function () {
    await token.mintToken(addr1.address, ethers.parseEther("100"));
    expect(await token.balanceOf(addr1.address)).to.equal(ethers.parseEther("100"));
    expect(await token.totalSupply()).to.equal(ethers.parseEther("50000000100"));
  });

  it("should allow owner to freeze and unfreeze accounts", async function () {
    await token.freezeAccount(addr1.address, true);
    await expect(token.connect(addr1).transfer(addr2.address, ethers.parseEther("10"))).to.be.reverted;
    await token.freezeAccount(addr1.address, false);
    await token.transfer(addr1.address, ethers.parseEther("10"));
    await token.connect(addr1).transfer(addr2.address, ethers.parseEther("10"));
    expect(await token.balanceOf(addr2.address)).to.equal(ethers.parseEther("10"));
  });

  it("should allow burning tokens", async function () {
    await token.burn(ethers.parseEther("100"));
    expect(await token.totalSupply()).to.equal(ethers.parseEther("49999999900"));
    expect(await token.balanceOf(owner.address)).to.equal(ethers.parseEther("49999999900"));
  });

  it("should allow burning tokens from another account", async function () {
    await token.transfer(addr1.address, ethers.parseEther("100"));
    await token.connect(addr1).approve(owner.address, ethers.parseEther("50"));
    await token.burnFrom(addr1.address, ethers.parseEther("50"));
    expect(await token.balanceOf(addr1.address)).to.equal(ethers.parseEther("50"));
    expect(await token.totalSupply()).to.equal(ethers.parseEther("49999999950"));
  });

  it("should allow setting token name and symbol", async function () {
    await token.setTokenName("New Token Name");
    await token.setTokenSymbol("NTN");
    expect(await token.tokenName()).to.equal("New Token Name");
    expect(await token.tokenSymbol()).to.equal("NTN");
  });

  it("should allow setting minimum balance for accounts", async function () {
    await token.connect(owner).setMinBalance(10); // 10 finney
    expect(await token.connect(owner).minBalanceForAccounts()).to.equal(ethers.parseEther("0.01"));
  });
});
