const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("EightteenToken", function () {
  let Token, token, owner, addr1, addr2;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    const TokenFactory = await ethers.getContractFactory("EightteenToken");
    token = await TokenFactory.deploy();
  });

  it("Should deploy with the correct total supply and assign it to the founder", async function () {
    const totalSupply = await token.totalSupply();
    const founderBalance = await token.balanceOf(owner.address);
    expect(totalSupply).to.equal(ethers.parseEther("1000000000"));
    expect(founderBalance).to.equal(totalSupply);
  });

  it("Should transfer tokens between accounts", async function () {
    await token.transfer(addr1.address, ethers.parseEther("100"));
    const addr1Balance = await token.balanceOf(addr1.address);
    expect(addr1Balance).to.equal(ethers.parseEther("100"));
  });

  it("Should fail if sender doesn’t have enough tokens", async function () {
    await expect(
      token.connect(addr1).transfer(addr2.address, ethers.parseEther("100"))
    ).to.be.reverted;
  });

  it("Should approve tokens for delegated transfer", async function () {
    await token.approve(addr1.address, ethers.parseEther("100"));
    const allowance = await token.allowance(owner.address, addr1.address);
    expect(allowance).to.equal(ethers.parseEther("100"));
  });

  it("Should handle delegated token transfers", async function () {
    await token.approve(addr1.address, ethers.parseEther("100"));
    await token
      .connect(addr1)
      .transferFrom(owner.address, addr2.address, ethers.parseEther("100"));
    const addr2Balance = await token.balanceOf(addr2.address);
    expect(addr2Balance).to.equal(ethers.parseEther("100"));
  });

  it("Should fail if transferFrom exceeds allowance", async function () {
    await token.approve(addr1.address, ethers.parseEther("50"));
    await expect(
      token
        .connect(addr1)
        .transferFrom(owner.address, addr2.address, ethers.parseEther("100"))
    ).to.be.reverted;
  });
});