const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ERCDDAToken", function () {
  let Token, token, owner, addr1, addr2;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    Token = await ethers.getContractFactory("ERCDDAToken");
    token = await Token.deploy(
      1000, // initial supply
      "TestToken", // token name
      "TTK" // token symbol
    );
  });

  it("Should set the correct owner", async function () {
    expect(await token.owner()).to.equal(owner.address);
  });

  it("Should initialize with correct total supply and balances", async function () {
    expect(await token.totalSupply()).to.equal(1000);
    expect(await token.balanceOf(owner.address)).to.equal(1000);
  });

  it("Should transfer tokens between accounts", async function () {
    await token.transfer(addr1.address, 100);
    expect(await token.balanceOf(owner.address)).to.equal(900);
    expect(await token.balanceOf(addr1.address)).to.equal(100);
  });

  it("Should fail if sender does not have enough balance", async function () {
    await expect(token.connect(addr1).transfer(addr2.address, 100)).to.be.revertedWithoutReason();
  });

  it("Should freeze and unfreeze accounts", async function () {
    await token.freezeAccount(addr1.address, true);
    expect(await token.frozenAccount(addr1.address)).to.equal(true);

    await expect(token.connect(addr1).transfer(addr2.address, 100)).to.be.revertedWithoutReason();

    await token.freezeAccount(addr1.address, false);
    expect(await token.frozenAccount(addr1.address)).to.equal(false);
  });

  it("Should mint new tokens", async function () {
    await token.mintToken(addr1.address, 500);
    expect(await token.totalSupply()).to.equal(1500);
    expect(await token.balanceOf(addr1.address)).to.equal(500);
  });

  it("Should burn tokens", async function () {
    await token.burn(200);
    expect(await token.totalSupply()).to.equal(800);
    expect(await token.balanceOf(owner.address)).to.equal(800);
  });

  it("Should fail to burn more tokens than balance", async function () {
    await expect(token.burn(2000)).to.be.revertedWithoutReason();
  });

  it("Should not allow non-owner to freeze accounts", async function () {
    await expect(token.connect(addr1).freezeAccount(addr2.address, true)).to.be.revertedWithoutReason();
  });

  it("Should not allow non-owner to mint tokens", async function () {
    await expect(token.connect(addr1).mintToken(addr2.address, 500)).to.be.revertedWithoutReason();
  });

  it("Should not allow non-owner to burn tokens", async function () {
    await expect(token.connect(addr1).burn(100)).to.be.revertedWithoutReason();
  });
});
