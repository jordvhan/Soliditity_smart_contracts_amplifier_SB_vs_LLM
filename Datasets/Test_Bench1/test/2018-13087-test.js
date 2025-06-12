const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MyAdvancedToken", function () {
  let owner, addr1, addr2, token;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    const MyAdvancedToken = await ethers.getContractFactory("contracts/2018-13087.sol:MyAdvancedToken");
    token = await MyAdvancedToken.deploy(
      1000, // initial supply
      "TestToken", // token name
      "TTK" // token symbol
    );
  });

  it("should initialize with correct values", async function () {
    expect(await token.name()).to.equal("TestToken");
    expect(await token.symbol()).to.equal("TTK");
    expect(await token.totalSupply()).to.equal(ethers.parseEther("1000"));
    expect(await token.balanceOf(owner.address)).to.equal(ethers.parseEther("1000"));
  });

  it("should transfer tokens correctly", async function () {
    await token.transfer(addr1.address, ethers.parseEther("100"));
    expect(await token.balanceOf(owner.address)).to.equal(ethers.parseEther("900"));
    expect(await token.balanceOf(addr1.address)).to.equal(ethers.parseEther("100"));
  });

  it("should fail transfer if balance is insufficient", async function () {
    await expect(token.connect(addr1).transfer(addr2.address, ethers.parseEther("1"))).to.be.reverted;
  });

  it("should allow owner to mint tokens", async function () {
    await token.mintToken(addr1.address, ethers.parseEther("500"));
    expect(await token.totalSupply()).to.equal(ethers.parseEther("1500"));
    expect(await token.balanceOf(addr1.address)).to.equal(ethers.parseEther("500"));
  });

  it("should allow owner to freeze accounts", async function () {
    await token.freezeAccount(addr1.address, true);
    expect(await token.frozenAccount(addr1.address)).to.be.true;

    await expect(token.connect(addr1).transfer(addr2.address, ethers.parseEther("1"))).to.be.reverted;
  });

  it("should allow owner to set buy and sell prices", async function () {
    await token.setPrices(ethers.parseEther("0.01"), ethers.parseEther("0.02"));
    expect(await token.sellPrice()).to.equal(ethers.parseEther("0.01"));
    expect(await token.buyPrice()).to.equal(ethers.parseEther("0.02"));
  });

  it("should burn tokens correctly", async function () {
    await token.burn(ethers.parseEther("100"));
    expect(await token.totalSupply()).to.equal(ethers.parseEther("900"));
    expect(await token.balanceOf(owner.address)).to.equal(ethers.parseEther("900"));
  });

  it("should burn tokens from another account correctly", async function () {
    await token.transfer(addr1.address, ethers.parseEther("100"));
    await token.connect(addr1).approve(owner.address, ethers.parseEther("50"));
    await token.burnFrom(addr1.address, ethers.parseEther("50"));

    expect(await token.totalSupply()).to.equal(ethers.parseEther("950"));
    expect(await token.balanceOf(addr1.address)).to.equal(ethers.parseEther("50"));
  });
});
