const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MyAdvancedToken", function () {
  let owner, addr1, addr2, token;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    const Token = await ethers.getContractFactory("contracts/2018-13082.sol:MyAdvancedToken");
    token = await Token.deploy(10000, "MODI Token", "MODI");
    //await token.deployed();
  });

  it("Should deploy with correct initial values", async function () {
    expect(await token.name()).to.equal("MODI Token");
    expect(await token.symbol()).to.equal("MODI");
    expect(await token.totalSupply()).to.equal(ethers.parseEther("10000"));
    expect(await token.balanceOf(owner.address)).to.equal(ethers.parseEther("10000"));
  });

  it("Should transfer tokens between accounts", async function () {
    await token.transfer(addr1.address, ethers.parseEther("100"));
    expect(await token.balanceOf(addr1.address)).to.equal(ethers.parseEther("100"));
    expect(await token.balanceOf(owner.address)).to.equal(ethers.parseEther("9900"));
  });

  it("Should fail if sender doesn’t have enough tokens", async function () {
    await expect(token.connect(addr1).transfer(addr2.address, ethers.parseEther("1"))).to.be.reverted;
  });

  it("Should allow owner to mint tokens", async function () {
    await token.mintToken(addr1.address, ethers.parseEther("500"));
    expect(await token.balanceOf(addr1.address)).to.equal(ethers.parseEther("500"));
    expect(await token.totalSupply()).to.equal(ethers.parseEther("10500"));
  });

  it("Should allow burning tokens", async function () {
    await token.burn(ethers.parseEther("100"));
    expect(await token.totalSupply()).to.equal(ethers.parseEther("9900"));
    expect(await token.balanceOf(owner.address)).to.equal(ethers.parseEther("9900"));
  });

  it("Should allow burning tokens from another account", async function () {
    await token.transfer(addr1.address, ethers.parseEther("100"));
    await token.connect(addr1).approve(owner.address, ethers.parseEther("50"));
    await token.burnFrom(addr1.address, ethers.parseEther("50"));
    expect(await token.balanceOf(addr1.address)).to.equal(ethers.parseEther("50"));
    expect(await token.totalSupply()).to.equal(ethers.parseEther("9950"));
  });

  it("Should freeze and unfreeze accounts", async function () {
    await token.freezeAccount(addr1.address, true);
    await expect(token.connect(addr1).transfer(addr2.address, ethers.parseEther("1"))).to.be.reverted;
    await token.freezeAccount(addr1.address, false);
    await token.transfer(addr1.address, ethers.parseEther("100"));
    expect(await token.balanceOf(addr1.address)).to.equal(ethers.parseEther("100"));
  });

  it("Should set buy and sell prices", async function () {
    await token.setPrices(ethers.parseEther("0.01"), ethers.parseEther("0.02"));
    expect(await token.sellPrice()).to.equal(ethers.parseEther("0.01"));
    expect(await token.buyPrice()).to.equal(ethers.parseEther("0.02"));
  });

  it("Should fail to transfer to the zero address", async function () {
    await expect(token.transfer("0x0000000000000000000000000000000000000000", ethers.parseEther("100"))).to.be.reverted;
  });

  it("Should handle transfer to self", async function () {
    await token.transfer(owner.address, ethers.parseEther("100"));
    expect(await token.balanceOf(owner.address)).to.equal(ethers.parseEther("10000"));
  });

  it("Should fail burn if account doesn't have enough tokens", async function () {
    await expect(token.connect(addr1).burn(ethers.parseEther("100"))).to.be.reverted;
  });

  it("Should fail burnFrom if account doesn't have enough allowance", async function () {
    await token.transfer(addr1.address, ethers.parseEther("100"));
    await expect(token.burnFrom(addr1.address, ethers.parseEther("50"))).to.be.reverted;
  });

  it("Should handle zero burn", async function () {
    await token.burn(ethers.parseEther("0"));
    expect(await token.totalSupply()).to.equal(ethers.parseEther("10000"));
  });

  it("Should handle zero mint", async function () {
    await token.mintToken(addr1.address, ethers.parseEther("0"));
    expect(await token.balanceOf(addr1.address)).to.equal(ethers.parseEther("0"));
    expect(await token.totalSupply()).to.equal(ethers.parseEther("10000"));
  });
});
