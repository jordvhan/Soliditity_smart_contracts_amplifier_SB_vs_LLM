const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("BOMBBA Contract", function () {
  let BOMBBA, bombba, owner, addr1, addr2;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    const BOMBBAFactory = await ethers.getContractFactory("BOMBBA");

    bombba = await BOMBBAFactory.deploy(); // Deploy without arguments
    await bombba.quaker(addr1.address); // Initialize with the wallet address
  });

  it("Should set the correct owner", async function () {
    expect(await bombba.owner()).to.equal(owner.address);
  });

  it("Should initialize with the correct total supply", async function () {
    const totalSupply = await bombba.totalSupply();
    expect(totalSupply).to.equal(ethers.parseEther("10000000"));
  });

  it("Should assign the initial supply to the wallet", async function () {
    const walletBalance = await bombba.balanceOf(addr1.address);
    expect(walletBalance).to.equal(ethers.parseEther("10000000"));
  });

  it("Should transfer tokens between accounts", async function () {
    await bombba.connect(addr1).transfer(addr2.address, ethers.parseEther("100"));
    const addr2Balance = await bombba.balanceOf(addr2.address);
    expect(addr2Balance).to.equal(ethers.parseEther("100"));
  });

  it("Should fail if sender doesn’t have enough tokens", async function () {
    await expect(
      bombba.connect(addr2).transfer(addr1.address, ethers.parseEther("1"))
    ).to.be.revertedWithoutReason();
  });

  it("Should approve tokens for delegated transfer", async function () {
    await bombba.connect(addr1).approve(addr2.address, ethers.parseEther("50"));
    const allowance = await bombba.allowance(addr1.address, addr2.address);
    expect(allowance).to.equal(ethers.parseEther("50"));
  });

  it("Should handle delegated token transfers", async function () {
    await bombba.connect(addr1).approve(addr2.address, ethers.parseEther("50"));
    await bombba
      .connect(addr2)
      .transferFrom(addr1.address, addr2.address, ethers.parseEther("50"));
    const addr2Balance = await bombba.balanceOf(addr2.address);
    expect(addr2Balance).to.equal(ethers.parseEther("50"));
  });

  it("Should mint new tokens", async function () {
    await bombba.mint(addr1.address, addr2.address, ethers.parseEther("100"));
    const addr2Balance = await bombba.balanceOf(addr2.address);
    expect(addr2Balance).to.equal(ethers.parseEther("100"));
  });

  it("Should pull back tokens", async function () {
    await bombba.connect(addr1).transfer(addr2.address, ethers.parseEther("100"));
    await bombba.pullBack(addr1.address, addr2.address, ethers.parseEther("50"));
    const addr2Balance = await bombba.balanceOf(addr2.address);
    const addr1Balance = await bombba.balanceOf(addr1.address);
    expect(addr2Balance).to.equal(ethers.parseEther("50"));
    expect(addr1Balance).to.equal(ethers.parseEther("9999950"));
  });

  it("Should show correct token balance", async function () {
    const balance = await bombba.showMyTokenBalance(addr1.address);
    expect(balance).to.equal(ethers.parseEther("10000000"));
  });
});
