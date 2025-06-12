const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("EightteenToken", function () {
  let Token, token, owner, addr1, addr2, addr3;

  beforeEach(async function () {
    [owner, addr1, addr2, addr3] = await ethers.getSigners();
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

  it("Should fail if transfer to address(0)", async function () {
    await expect(
      token.transfer(ethers.ZeroAddress, ethers.parseEther("100"))
    ).to.be.reverted;
  });

  it("Should fail if transferFrom to address(0)", async function () {
    await token.approve(addr1.address, ethers.parseEther("100"));
    await expect(
      token
        .connect(addr1)
        .transferFrom(owner.address, ethers.ZeroAddress, ethers.parseEther("100"))
    ).to.be.reverted;
  });

  it("Should return the correct token name", async function () {
    expect(await token.name()).to.equal("Block 18");
  });

  it("Should return the correct token symbol", async function () {
    expect(await token.symbol()).to.equal("18T");
  });

  it("Should return the correct token decimals", async function () {
    expect(await token.decimals()).to.equal(18);
  });

  it("Should return the correct token version", async function () {
    expect(await token.version()).to.equal("v0.1");
  });

  it("Should revert when receiving ether", async function () {
    await expect(
      addr1.sendTransaction({
        to: token.target,
        value: ethers.parseEther("1.0"),
      })
    ).to.be.reverted;
  });
});