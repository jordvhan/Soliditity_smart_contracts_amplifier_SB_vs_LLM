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
});
