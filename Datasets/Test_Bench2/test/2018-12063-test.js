const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("INTToken Contract", function () {
  let owner, addr1, addr2, token;

  beforeEach(async function () {
    const INTToken = await ethers.getContractFactory("contracts/2018-12063.sol:INTToken");
    [owner, addr1, addr2] = await ethers.getSigners();
    token = await INTToken.deploy(
      1000000000000000,
      "Internet Node Token",
      6,
      "INT"
    );
  });

  it("Should initialize with correct values", async function () {
    expect(await token.name()).to.equal("Internet Node Token");
    expect(await token.symbol()).to.equal("INT");
    expect(await token.decimals()).to.equal(6);
    expect(await token.totalSupply()).to.equal(1000000000000000);
    expect(await token.balanceOf(owner.address)).to.equal(1000000000000000);
  });

  it("Should transfer tokens between accounts", async function () {
    await token.transfer(addr1.address, 1000);
    expect(await token.balanceOf(addr1.address)).to.equal(1000);
    expect(await token.balanceOf(owner.address)).to.equal(999999999999000);
  });

  it("Should not allow transfer from frozen accounts", async function () {
    await token.freezeAccount(addr1.address, true);
    await expect(token.connect(addr1).transfer(addr2.address, 1000)).to.be.reverted;
  });

  it("Should allow minting of new tokens", async function () {
    await token.mintToken(addr1.address, 5000);
    expect(await token.balanceOf(addr1.address)).to.equal(5000);
    expect(await token.totalSupply()).to.equal(1000000000005000);
  });

  it("Should allow setting and retrieving buy/sell prices", async function () {
    await token.setPrices(ethers.parseEther("0.01"), ethers.parseEther("0.02"));
    expect(await token.sellPrice()).to.equal(ethers.parseEther("0.01"));
    expect(await token.buyPrice()).to.equal(ethers.parseEther("0.02"));
  });

  it("Should burn tokens correctly", async function () {
    await token.burn(1000);
    expect(await token.totalSupply()).to.equal(999999999999000);
    expect(await token.balanceOf(owner.address)).to.equal(999999999999000);
  });

  it("Should burn tokens from another account", async function () {
    await token.transfer(addr1.address, 1000);
    await token.connect(addr1).approve(owner.address, 500);
    await token.burnFrom(addr1.address, 500);
    expect(await token.balanceOf(addr1.address)).to.equal(500);
    expect(await token.totalSupply()).to.equal(999999999999500);
  });

  it("Should prevent selling if contract has insufficient ether", async function () {
    await token.setPrices(ethers.parseEther("1"), ethers.parseEther("2"));
    await token.transfer(addr1.address, 1000);
    // Attempting to sell when the contract has no ether should fail.
    await expect(token.connect(addr1).sell(500)).to.be.reverted;
  });

  it("Should prevent transfer to the zero address", async function () {
    await expect(token.transfer("0x0000000000000000000000000000000000000000", 1000)).to.be.reverted;
  });

  it("Should allow approve", async function () {
    await token.approve(addr1.address, 100);
    expect(await token.allowance(owner.address, addr1.address)).to.equal(100);
  });

  it("Should allow transferFrom", async function () {
    await token.transfer(addr1.address, 200);
    await token.connect(addr1).approve(owner.address, 100);
    await token.transferFrom(addr1.address, addr2.address, 50);
    expect(await token.balanceOf(addr1.address)).to.equal(150);
    expect(await token.balanceOf(addr2.address)).to.equal(50);
    expect(await token.allowance(addr1.address, owner.address)).to.equal(50);
  });

  it("Should prevent transferFrom if allowance is not enough", async function () {
    await token.transfer(addr1.address, 100);
    await token.connect(addr1).approve(owner.address, 50);
    await expect(token.transferFrom(addr1.address, addr2.address, 100)).to.be.reverted;
  });

  it("Should prevent non-owner from minting tokens", async function () {
    await expect(token.connect(addr1).mintToken(addr2.address, 100)).to.be.reverted;
  });

  it("Should prevent non-owner from freezing accounts", async function () {
    await expect(token.connect(addr1).freezeAccount(addr2.address, true)).to.be.reverted;
  });

  it("Should prevent non-owner from setting prices", async function () {
    await expect(token.connect(addr1).setPrices(ethers.parseEther("0.01"), ethers.parseEther("0.02"))).to.be.reverted;
  });

  it("Should prevent non-owner from transferring ownership", async function () {
    await expect(token.connect(addr1).transferOwnership(addr2.address)).to.be.reverted;
  });

  it("Should prevent transfer if sender is frozen", async function () {
    await token.freezeAccount(owner.address, true);
    await expect(token.transfer(addr1.address, 100)).to.be.reverted;
  });

  it("Should prevent transfer if recipient is frozen", async function () {
    await token.freezeAccount(addr1.address, true);
    await expect(token.transfer(addr1.address, 100)).to.be.reverted;
  });

  it("Should prevent burn if balance is insufficient", async function () {
    await expect(token.connect(addr1).burn(1)).to.be.reverted;
  });

  it("Should prevent burnFrom if balance is insufficient", async function () {
    await token.transfer(addr1.address, 100);
    await token.connect(addr1).approve(owner.address, 200);
    await expect(token.burnFrom(addr1.address, 200)).to.be.reverted;
  });

  it("Should prevent burnFrom if allowance is insufficient", async function () {
    await token.transfer(addr1.address, 100);
    await token.connect(addr1).approve(owner.address, 50);
    await expect(token.burnFrom(addr1.address, 100)).to.be.reverted;
  });

  it("Should prevent buying if contract has zero tokens", async function () {
    await token.setPrices(ethers.parseEther("0.01"), ethers.parseEther("0.02"));
    await expect(token.connect(addr1).buy({ value: ethers.parseEther("0.1") })).to.be.reverted;
  });

  it("Should prevent selling if user has zero tokens", async function () {
    await token.setPrices(ethers.parseEther("0.01"), ethers.parseEther("0.02"));
    await expect(token.connect(addr1).sell(0)).to.be.reverted;
  });
});


