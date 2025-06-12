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

  it("should not allow burning more tokens than balance", async function () {
    await expect(token.burn(ethers.parseEther("50000000001"))).to.be.reverted;
  });

  it("should not allow burning tokens from another account without allowance", async function () {
    await token.transfer(addr1.address, ethers.parseEther("100"));
    await expect(token.burnFrom(addr1.address, ethers.parseEther("50"))).to.be.reverted;
  });

  it("should handle transferFrom with insufficient allowance", async function () {
    await token.approve(addr1.address, ethers.parseEther("10"));
    await expect(token.connect(addr1).transferFrom(owner.address, addr2.address, ethers.parseEther("50"))).to.be.reverted;
  });

  it("should handle transferFrom with zero allowance", async function () {
    await expect(token.connect(addr1).transferFrom(owner.address, addr2.address, ethers.parseEther("50"))).to.be.reverted;
  });

  it("should handle setMinBalance with zero value", async function () {
    await token.connect(owner).setMinBalance(0);
    expect(await token.connect(owner).minBalanceForAccounts()).to.equal(ethers.parseEther("0"));
  });

  it("should handle setTokenName with empty string", async function () {
    await token.setTokenName("");
    expect(await token.tokenName()).to.equal("");
  });

  it("should handle setTokenSymbol with empty string", async function () {
    await token.setTokenSymbol("");
    expect(await token.tokenSymbol()).to.equal("");
  });

  it("should prevent transfers when the sender is frozen", async function () {
    await token.freezeAccount(owner.address, true);
    await expect(token.transfer(addr1.address, ethers.parseEther("10"))).to.be.reverted;
    await token.freezeAccount(owner.address, false);
  });

  it("should prevent transfers when the recipient is frozen", async function () {
    await token.freezeAccount(addr1.address, true);
    await expect(token.transfer(addr1.address, ethers.parseEther("10"))).to.be.reverted;
    await token.freezeAccount(addr1.address, false);
  });

  it("should handle minting zero tokens", async function () {
    await token.mintToken(addr1.address, ethers.parseEther("0"));
    expect(await token.balanceOf(addr1.address)).to.equal(ethers.parseEther("0"));
  });

  it("should handle burning zero tokens", async function () {
    await token.burn(ethers.parseEther("0"));
    expect(await token.totalSupply()).to.equal(ethers.parseEther("50000000000"));
  });

  it("should handle burning zero tokens from another account", async function () {
    await token.transfer(addr1.address, ethers.parseEther("100"));
    await token.connect(addr1).approve(owner.address, ethers.parseEther("0"));
    await token.burnFrom(addr1.address, ethers.parseEther("0"));
    expect(await token.balanceOf(addr1.address)).to.equal(ethers.parseEther("100"));
  });

  it("should handle setting the same token name", async function () {
    await token.setTokenName("Carbon Exchange Coin Token");
    expect(await token.tokenName()).to.equal("Carbon Exchange Coin Token");
  });

  it("should handle setting the same token symbol", async function () {
    await token.setTokenSymbol("CEC");
    expect(await token.tokenSymbol()).to.equal("CEC");
  });

  it("should handle setting the same minimum balance", async function () {
    await token.connect(owner).setMinBalance(0);
    expect(await token.connect(owner).minBalanceForAccounts()).to.equal(ethers.parseEther("0"));
  });

  it("should handle transfer to self", async function () {
    const initialBalance = await token.balanceOf(owner.address);
    await token.transfer(owner.address, ethers.parseEther("100"));
    expect(await token.balanceOf(owner.address)).to.equal(initialBalance);
  });
});
