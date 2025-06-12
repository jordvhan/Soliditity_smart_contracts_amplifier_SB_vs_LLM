const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("HumanStandardToken", function () {
  let Token, token, owner, addr1, addr2;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    Token = await ethers.getContractFactory("HumanStandardToken");
    token = await Token.deploy(
      ethers.parseEther("1000"), // Initial supply
      "TestToken",              // Token name
      18,                       // Decimals
      "TT"                      // Symbol
    );
  });

  it("Should set the correct initial values", async function () {
    expect(await token.name()).to.equal("TestToken");
    expect(await token.symbol()).to.equal("TT");
    expect(await token.decimals()).to.equal(18);
    expect(await token.totalSupply()).to.equal(ethers.parseEther("1000"));
    expect(await token.balanceOf(owner.address)).to.equal(ethers.parseEther("1000"));
  });

  it("Should transfer tokens successfully", async function () {
    await token.transfer(addr1.address, ethers.parseEther("100"));
    expect(await token.balanceOf(owner.address)).to.equal(ethers.parseEther("900"));
    expect(await token.balanceOf(addr1.address)).to.equal(ethers.parseEther("100"));
  });

  it("Should fail to transfer tokens if balance is insufficient", async function () {
    await expect(
      token.connect(addr1).transfer(addr2.address, ethers.parseEther("1"))
    ).to.be.reverted;
  });

  it("Should approve tokens for delegated transfer", async function () {
    await token.approve(addr1.address, ethers.parseEther("50"));
    expect(await token.allowance(owner.address, addr1.address)).to.equal(ethers.parseEther("50"));
  });

  it("Should handle delegated transfers successfully", async function () {
    await token.approve(addr1.address, ethers.parseEther("50"));
    await token.connect(addr1).transferFrom(owner.address, addr2.address, ethers.parseEther("50"));
    expect(await token.balanceOf(owner.address)).to.equal(ethers.parseEther("950"));
    expect(await token.balanceOf(addr2.address)).to.equal(ethers.parseEther("50"));
    expect(await token.allowance(owner.address, addr1.address)).to.equal(ethers.parseEther("0"));
  });

  it("Should fail delegated transfer if allowance is insufficient", async function () {
    await expect(
      token.connect(addr1).transferFrom(owner.address, addr2.address, ethers.parseEther("1"))
    ).to.be.reverted;
  });

  it("Should emit Transfer event on successful transfer", async function () {
    await expect(token.transfer(addr1.address, ethers.parseEther("100")))
      .to.emit(token, "Transfer")
      .withArgs(owner.address, addr1.address, ethers.parseEther("100"));
  });

  it("Should emit Approval event on successful approval", async function () {
    await expect(token.approve(addr1.address, ethers.parseEther("50")))
      .to.emit(token, "Approval")
      .withArgs(owner.address, addr1.address, ethers.parseEther("50"));
  });
});
