const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MyAdvancedToken", function () {
  let Token, token, owner, addr1, addr2;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    Token = await ethers.getContractFactory("contracts/2018-12068.sol:MyAdvancedToken");
    token = await Token.deploy(
      1000, // initialSupply
      "TestToken", // tokenName
      18, // decimalUnits
      "TTK" // tokenSymbol
    );
  });

  it("Should set the correct owner", async function () {
    expect(await token.owner()).to.equal(owner.address);
  });

  it("Should assign the initial supply to the owner", async function () {
    expect(await token.balanceOf(owner.address)).to.equal(1000);
  });

  it("Should transfer tokens between accounts", async function () {
    await token.transfer(addr1.address, 100);
    expect(await token.balanceOf(addr1.address)).to.equal(100);
    expect(await token.balanceOf(owner.address)).to.equal(900);
  });

  it("Should not allow transfer if sender has insufficient balance", async function () {
    await expect(token.connect(addr1).transfer(addr2.address, 100)).to.be.reverted;
  });

  it("Should allow owner to mint tokens", async function () {
    await token.mintToken(addr1.address, 500);
    expect(await token.balanceOf(addr1.address)).to.equal(500);
    expect(await token.totalSupply()).to.equal(1500);
  });

  it("Should allow owner to freeze and unfreeze accounts", async function () {
    await token.freezeAccount(addr1.address, true);
    await expect(token.connect(addr1).transfer(addr2.address, 100)).to.be.reverted;
    await token.freezeAccount(addr1.address, false);
    await token.transfer(addr1.address, 100);
    await token.connect(addr1).transfer(addr2.address, 50);
    expect(await token.balanceOf(addr2.address)).to.equal(50);
  });

  it("Should allow owner to set buy and sell prices", async function () {
    await token.setPrices(ethers.parseEther("0.01"), ethers.parseEther("0.02"));
    expect(await token.sellPrice()).to.equal(ethers.parseEther("0.01"));
    expect(await token.buyPrice()).to.equal(ethers.parseEther("0.02"));
  });

  it("Should not allow buying if contract has insufficient tokens", async function () {
    await token.setPrices(ethers.parseEther("0.01"), ethers.parseEther("0.02"));
    await expect(token.connect(addr1).buy({ value: ethers.parseEther("10") })).to.be.reverted;
  });

  it("Should not allow selling if user has insufficient tokens", async function () {
    await token.setPrices(ethers.parseEther("0.01"), ethers.parseEther("0.02"));
    await expect(token.connect(addr1).sell(10)).to.be.reverted;
  });
});
