const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("GZSToken Contract", function () {
  let owner, addr1, addr2, GZSToken, token;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    const initialSupply = ethers.parseEther("1000");
    GZSToken = await ethers.getContractFactory("GZSToken");
    token = await GZSToken.deploy(initialSupply, "GZS Token", 18, "GZS");
  });

  it("Should deploy with correct initial supply", async function () {
    const totalSupply = await token.totalSupply();
    expect(totalSupply).to.equal(ethers.parseEther("1000"));
    const ownerBalance = await token.balanceOf(owner.address);
    expect(ownerBalance).to.equal(ethers.parseEther("1000"));
  });

  it("Should transfer tokens between accounts", async function () {
    await token.transfer(addr1.address, ethers.parseEther("100"));
    const addr1Balance = await token.balanceOf(addr1.address);
    expect(addr1Balance).to.equal(ethers.parseEther("100"));
  });

  it("Should fail transfer if sender does not have enough balance", async function () {
    await expect(
      token.connect(addr1).transfer(addr2.address, ethers.parseEther("1"))
    ).to.be.reverted;
  });

  it("Should allow owner to mint tokens", async function () {
    await token.mintToken(addr1.address, ethers.parseEther("500"));
    const addr1Balance = await token.balanceOf(addr1.address);
    expect(addr1Balance).to.equal(ethers.parseEther("500"));
    const totalSupply = await token.totalSupply();
    expect(totalSupply).to.equal(ethers.parseEther("1500"));
  });

  it("Should allow owner to freeze and unfreeze accounts", async function () {
    await token.freezeAccount(addr1.address, true);
    await expect(
      token.connect(addr1).transfer(addr2.address, ethers.parseEther("1"))
    ).to.be.reverted;
    await token.freezeAccount(addr1.address, false);
    await token.transfer(addr1.address, ethers.parseEther("100"));
    await token.connect(addr1).transfer(addr2.address, ethers.parseEther("50"));
    const addr2Balance = await token.balanceOf(addr2.address);
    expect(addr2Balance).to.equal(ethers.parseEther("50"));
  });

  it("Should allow owner to set buy rate and selling status", async function () {
    await token.setBuyRate(50000);
    const buyRate = await token.buyRate();
    expect(buyRate).to.equal(50000);

    await token.setSelling(false);
    const isSelling = await token.isSelling();
    expect(isSelling).to.equal(false);
  });

  it("Should prevent buying tokens when selling is disabled", async function () {
    await token.setSelling(false);
    await expect(
      token.connect(addr1).buy({ value: ethers.parseEther("1") })
    ).to.be.reverted;
  });

  it("Should allow owner to withdraw funds", async function () {
    await token.connect(addr1).buy({ value: ethers.parseEther("1") });
    const initialOwnerBalance = await ethers.provider.getBalance(owner.address);
    await token.withdrawToOwner(ethers.parseEther("1"));
    const finalOwnerBalance = await ethers.provider.getBalance(owner.address);
    expect(finalOwnerBalance).to.be.gt(initialOwnerBalance);
  });
});
