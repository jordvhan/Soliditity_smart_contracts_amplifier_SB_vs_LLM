const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("UCoinToken", function () {
  let UCoinToken, uCoinToken, owner, addr1, addr2;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    const Token = await ethers.getContractFactory("UCoinToken");
    uCoinToken = await Token.deploy();
  });

  it("should initialize with correct values", async function () {
    expect(await uCoinToken.name()).to.equal("Universal Coin");
    expect(await uCoinToken.symbol()).to.equal("UCOIN");
    expect(await uCoinToken.decimals()).to.equal(18);
    expect(await uCoinToken.totalSupply()).to.equal(ethers.parseEther("5000000000"));
    expect(await uCoinToken.balanceOf(owner.address)).to.equal(ethers.parseEther("5000000000"));
  });

  it("should transfer tokens correctly", async function () {
    await uCoinToken.transfer(addr1.address, ethers.parseEther("100"));
    expect(await uCoinToken.balanceOf(addr1.address)).to.equal(ethers.parseEther("100"));
    expect(await uCoinToken.balanceOf(owner.address)).to.equal(ethers.parseEther("4999999900"));
  });

  it("should not allow transfer to 0x0 address", async function () {
    const AddressZero = "0x0000000000000000000000000000000000000000";
    await expect(uCoinToken.transfer(AddressZero, ethers.parseEther("100"))).to.be.reverted;
  });

  it("should approve and transferFrom correctly", async function () {
    await uCoinToken.approve(addr1.address, ethers.parseEther("200"));
    expect(await uCoinToken.allowance(owner.address, addr1.address)).to.equal(ethers.parseEther("200"));

    await uCoinToken.connect(addr1).transferFrom(owner.address, addr2.address, ethers.parseEther("100"));
    expect(await uCoinToken.balanceOf(addr2.address)).to.equal(ethers.parseEther("100"));
    expect(await uCoinToken.allowance(owner.address, addr1.address)).to.equal(ethers.parseEther("100"));
  });

  it("should mint tokens correctly", async function () {
    await uCoinToken.mintToken(addr1.address, ethers.parseEther("500"));
    expect(await uCoinToken.balanceOf(addr1.address)).to.equal(ethers.parseEther("500"));
    expect(await uCoinToken.totalSupply()).to.equal(ethers.parseEther("5000000500"));
  });

  it("should freeze and unfreeze accounts", async function () {
    await uCoinToken.freezeAccount(addr1.address, true);
    expect(await uCoinToken.frozenAccount(addr1.address)).to.be.true;

    await expect(uCoinToken.connect(addr1).transfer(addr2.address, ethers.parseEther("100"))).to.be.reverted;

    await uCoinToken.freezeAccount(addr1.address, false);
    expect(await uCoinToken.frozenAccount(addr1.address)).to.be.false;
  });

  it("should set buy and sell prices", async function () {
    await uCoinToken.setPrices(ethers.parseEther("0.01"), ethers.parseEther("0.02"));
    expect(await uCoinToken.sellPrice()).to.equal(ethers.parseEther("0.01"));
    expect(await uCoinToken.buyPrice()).to.equal(ethers.parseEther("0.02"));
  });

  it("should burn tokens correctly", async function () {
    await uCoinToken.burn(ethers.parseEther("100"));
    expect(await uCoinToken.totalSupply()).to.equal(ethers.parseEther("4999999900"));
    expect(await uCoinToken.balanceOf(owner.address)).to.equal(ethers.parseEther("4999999900"));
  });

  it("should burn tokens from another account", async function () {
    await uCoinToken.transfer(addr1.address, ethers.parseEther("100"));
    await uCoinToken.connect(addr1).approve(owner.address, ethers.parseEther("50"));
    await uCoinToken.burnFrom(addr1.address, ethers.parseEther("50"));
    expect(await uCoinToken.balanceOf(addr1.address)).to.equal(ethers.parseEther("50"));
    expect(await uCoinToken.totalSupply()).to.equal(ethers.parseEther("4999999950"));
  });

  it("Should fail transfer if account is frozen", async function () {
    await uCoinToken.freezeAccount(addr1.address, true);
    await expect(uCoinToken.transfer(addr1.address, ethers.parseEther("10"))).to.be.reverted;
  });

  it("Should transfer ownership", async function () {
    await uCoinToken.transferOwnership(addr1.address);
    expect(await uCoinToken.owner()).to.equal(addr1.address);
  });

  it("Should fail minting if not owner", async function () {
    await expect(uCoinToken.connect(addr1).mintToken(addr2.address, ethers.parseEther("100"))).to.be.reverted;
  });

  it("Should fail freezing if not owner", async function () {
    await expect(uCoinToken.connect(addr1).freezeAccount(addr2.address, true)).to.be.reverted;
  });

  it("Should fail setting prices if not owner", async function () {
    await expect(uCoinToken.connect(addr1).setPrices(ethers.parseEther("0.01"), ethers.parseEther("0.02"))).to.be.reverted;
  });

  it("Should fail selling if contract has insufficient ether", async function () {
    await uCoinToken.setPrices(ethers.parseEther("1"), ethers.parseEther("2"));
    await uCoinToken.transfer(addr1.address, ethers.parseEther("10"));
    await expect(uCoinToken.connect(addr1).sell(ethers.parseEther("10"))).to.be.reverted;
  });
});
