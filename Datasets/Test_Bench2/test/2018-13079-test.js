const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("StandardToken Contract", function () {
  let owner, addr1, addr2, token, initialSupply;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    const StandardToken = await ethers.getContractFactory("contracts/2018-13079.sol:StandardToken");
    initialSupply = ethers.parseEther("1000");
    token = await StandardToken.deploy(initialSupply, "GoodToToken", "GTT");
    initialSupply = ethers.parseEther("1000000000000000000000");
  });

  it("Should set the correct owner", async function () {
    expect(await token.owner()).to.equal(owner.address);
  });

  it("Should initialize with correct total supply", async function () {
    expect(await token.totalSupply()).to.equal(initialSupply);
    expect(await token.balanceOf(owner.address)).to.equal(initialSupply);
  });

  it("Should transfer tokens between accounts", async function () {
    const transferAmount = ethers.parseEther("100");
    await token.transfer(addr1.address, transferAmount);
    expect(await token.balanceOf(owner.address)).to.equal(initialSupply - transferAmount);
    expect(await token.balanceOf(addr1.address)).to.equal(transferAmount);
  });

  it("Should fail transfer if sender has insufficient balance", async function () {
    const transferAmount = ethers.parseEther("100");
    await expect(token.connect(addr1).transfer(addr2.address, transferAmount)).to.be.reverted;
  });

  it("Should allow owner to mint tokens", async function () {
    const mintAmount = ethers.parseEther("500");
    await token.mintToken(addr1.address, mintAmount);
    expect(await token.totalSupply()).to.equal(initialSupply + mintAmount);
    expect(await token.balanceOf(addr1.address)).to.equal(mintAmount);
  });

  it("Should allow owner to freeze and unfreeze accounts", async function () {
    await token.freezeAccount(addr1.address, true);
    expect(await token.frozenAccount(addr1.address)).to.be.true;

    await expect(token.connect(addr1).transfer(addr2.address, ethers.parseEther("10"))).to.be.reverted;

    await token.freezeAccount(addr1.address, false);
    expect(await token.frozenAccount(addr1.address)).to.be.false;
  });

  it("Should allow owner to set buy and sell prices", async function () {
    const buyPrice = ethers.parseEther("0.01");
    const sellPrice = ethers.parseEther("0.02");
    await token.setPrices(sellPrice, buyPrice);
    expect(await token.sellPrice()).to.equal(sellPrice);
    expect(await token.buyPrice()).to.equal(buyPrice);
  });

  it("Should burn tokens correctly", async function () {
    const burnAmount = ethers.parseEther("100");
    await token.burn(burnAmount);
    expect(await token.totalSupply()).to.equal(initialSupply - burnAmount);
    expect(await token.balanceOf(owner.address)).to.equal(initialSupply - burnAmount);
  });

  it("Should burn tokens from another account with allowance", async function () {
    const burnAmount = ethers.parseEther("50");
    await token.approve(addr1.address, burnAmount);
    await token.connect(addr1).burnFrom(owner.address, burnAmount);

    expect(await token.totalSupply()).to.equal(initialSupply - burnAmount);
    expect(await token.balanceOf(owner.address)).to.equal(initialSupply - burnAmount);
  });

  it("Should allow zero-value burns", async function () {
    const initialBalance = await token.balanceOf(owner.address);
    await token.burn(0);
    expect(await token.balanceOf(owner.address)).to.equal(initialBalance);
  });

  it("Should prevent minting tokens by non-owner", async function () {
    const mintAmount = ethers.parseEther("500");
    await expect(token.connect(addr1).mintToken(addr1.address, mintAmount)).to.be
      .reverted;
  });

  it("Should prevent freezing accounts by non-owner", async function () {
    await expect(token.connect(addr1).freezeAccount(addr1.address, true)).to.be
      .reverted;
  });

  it("Should prevent setting prices by non-owner", async function () {
    const buyPrice = ethers.parseEther("0.01");
    const sellPrice = ethers.parseEther("0.02");
    await expect(token.connect(addr1).setPrices(sellPrice, buyPrice)).to.be
      .reverted;
  });

  it("Should handle transferFrom when the sender and receiver are the same", async function () {
    const transferAmount = ethers.parseEther("100");
    await token.approve(addr1.address, transferAmount);
    await token.connect(addr1).transferFrom(owner.address, owner.address, transferAmount);
    expect(await token.balanceOf(owner.address)).to.equal(initialSupply);
  });
});
