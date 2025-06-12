const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ALUXToken Contract", function () {
  let ALUXToken, aluxToken, owner, addr1, addr2;

  beforeEach(async function () {
    [owner, addr1, addr2, commissionGetter] = await ethers.getSigners();
    const initialSupply = 1000;
    const tokenName = "ALUX";
    const tokenSymbol = "ALX";

    const ALUXTokenFactory = await ethers.getContractFactory("ALUXToken");
    aluxToken = await ALUXTokenFactory.deploy(
      initialSupply,
      tokenName,
      tokenSymbol
    );
  });

  it("Should initialize with correct values", async function () {
    expect(await aluxToken.name()).to.equal("ALUX");
    expect(await aluxToken.symbol()).to.equal("ALX");
    expect(await aluxToken.totalSupply()).to.equal(1000);
    expect(await aluxToken.balanceOf(owner.address)).to.equal(1000);
  });

  it("Should allow owner to mint tokens", async function () {
    await aluxToken.mintToken(500);
    expect(await aluxToken.totalSupply()).to.equal(1500);
    expect(await aluxToken.balanceOf(owner.address)).to.equal(1500);
  });

  it("Should allow owner to freeze accounts", async function () {
    await aluxToken.freezeAccount(addr1.address, true);
    await expect(aluxToken.transfer(addr1.address, 100)).to.be.reverted;
  });

  it("Should allow setting buy and sell prices", async function () {
    await aluxToken.setPrices(ethers.parseEther("0.01"), ethers.parseEther("0.02"));
    expect(await aluxToken.sellPrice()).to.equal(ethers.parseEther("0.01"));
    expect(await aluxToken.buyPrice()).to.equal(ethers.parseEther("0.02"));
  });

  it("Should not allow non-owner to perform restricted actions", async function () {
    await expect(aluxToken.connect(addr1).mintToken(500)).to.be.reverted;
    await expect(aluxToken.connect(addr1).freezeAccount(addr2.address, true)).to.be
      .reverted;
    await expect(aluxToken.connect(addr1).setPrices(1, 1)).to.be.reverted;
  });
});
