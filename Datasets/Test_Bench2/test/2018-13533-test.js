const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ALUXToken Contract", function () {
  let ALUXToken, aluxToken, owner, addr1, addr2, commissionGetter;

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

  it("Should allow setting status", async function () {
    await aluxToken.setStatus(true, false);
    expect(await aluxToken.closeBuy()).to.equal(true);
    expect(await aluxToken.closeSell()).to.equal(false);
  });

  it("Should allow deposit", async function () {
    await aluxToken.deposit({ value: ethers.parseEther("1") });
  });

  it("Should allow withdraw", async function () {
    await aluxToken.deposit({ value: ethers.parseEther("1") });
    const initialBalance = await ethers.provider.getBalance(owner.address);
    await aluxToken.withdraw(ethers.parseEther("1"));
    const finalBalance = await ethers.provider.getBalance(owner.address);
    expect(finalBalance > initialBalance);
  });

  it("Should revert transfer to 0x0 address", async function () {
    await expect(aluxToken.transfer("0x0000000000000000000000000000000000000000", 100)).to.be.reverted;
  });

  it("Should revert transfer when balance is insufficient", async function () {
    await expect(aluxToken.transfer(owner.address, 1001)).to.be.reverted;
  });

  it("Should revert transferFrom to 0x0 address", async function () {
    await aluxToken.approve(addr1.address, 100);
    await expect(aluxToken.connect(addr1).transferFrom(owner.address, "0x0000000000000000000000000000000000000000", 50)).to.be.reverted;
  });

  it("Should revert transferFrom when balance is insufficient", async function () {
    await aluxToken.approve(addr1.address, 100);
    await expect(aluxToken.connect(addr1).transferFrom(owner.address, addr2.address, 1001)).to.be.reverted;
  });

  it("Should revert transferFrom when allowance is insufficient", async function () {
    await aluxToken.approve(addr1.address, 10);
    await expect(aluxToken.connect(addr1).transferFrom(owner.address, addr2.address, 50)).to.be.reverted;
  });

  it("Should revert transfer when account is frozen", async function () {
    await aluxToken.freezeAccount(owner.address, true);
    await expect(aluxToken.transfer(addr1.address, 100)).to.be.reverted;
  });

  it("Should revert transferFrom when account is frozen", async function () {
    await aluxToken.freezeAccount(owner.address, true);
    await aluxToken.approve(addr1.address, 100);
    await expect(aluxToken.connect(addr1).transferFrom(owner.address, addr2.address, 50)).to.be.reverted;
  });

  it("Should revert refillTokens when not owner", async function () {
    await expect(aluxToken.connect(addr1).refillTokens(100)).to.be.reverted;
  });

  it("Should revert withdraw when not owner", async function () {
    await aluxToken.deposit({ value: ethers.parseEther("1") });
    await expect(aluxToken.connect(addr1).withdraw(ethers.parseEther("1"))).to.be.reverted;
  });

  it("Should revert buy when closeBuy is true", async function () {
    await aluxToken.setStatus(true, false);
    await expect(aluxToken.buy({ value: ethers.parseEther("1") })).to.be.reverted;
  });
});
