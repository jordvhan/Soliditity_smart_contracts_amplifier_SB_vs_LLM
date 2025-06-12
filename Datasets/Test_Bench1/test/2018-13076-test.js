const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Betcash Contract", function () {
  let Betcash, betcash, owner, addr1, addr2;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    const initialSupply = ethers.parseEther("1000");
    Betcash = await ethers.getContractFactory("Betcash");
    betcash = await Betcash.deploy(initialSupply, "Betcash", 18, "BET");
  });

  it("Should set the correct owner", async function () {
    expect(await betcash.owner()).to.equal(owner.address);
  });

  it("Should initialize with correct token details", async function () {
    expect(await betcash.name()).to.equal("Betcash");
    expect(await betcash.symbol()).to.equal("BET");
    expect(await betcash.decimals()).to.equal(18);
    expect(await betcash.totalSupply()).to.equal(ethers.parseEther("1000"));
  });

  it("Should transfer tokens between accounts", async function () {
    await betcash.transfer(addr1.address, ethers.parseEther("100"));
    expect(await betcash.balanceOf(addr1.address)).to.equal(ethers.parseEther("100"));
    expect(await betcash.balanceOf(owner.address)).to.equal(ethers.parseEther("900"));
  });

  it("Should not allow transfer if sender has insufficient balance", async function () {
    await expect(betcash.connect(addr1).transfer(addr2.address, ethers.parseEther("1"))).to.be.reverted;
  });

  it("Should allow owner to mint tokens", async function () {
    await betcash.mintToken(addr1.address, ethers.parseEther("500"));
    expect(await betcash.balanceOf(addr1.address)).to.equal(ethers.parseEther("500"));
  });

  it("Should allow owner to freeze and unfreeze accounts", async function () {
    await betcash.freezeAccount(addr1.address, true);
    expect(await betcash.frozenAccount(addr1.address)).to.be.true;

    await expect(betcash.connect(addr1).transfer(addr2.address, ethers.parseEther("1"))).to.be.reverted;

    await betcash.freezeAccount(addr1.address, false);
    expect(await betcash.frozenAccount(addr1.address)).to.be.false;
  });

  it("Should allow owner to set buy rate and selling status", async function () {
    await betcash.setBuyRate(5000);
    expect(await betcash.buyRate()).to.equal(5000);

    await betcash.setSelling(false);
    expect(await betcash.isSelling()).to.be.false;
  });

  it("Should allow users to buy tokens when selling is enabled", async function () {
    // Owner moet genoeg tokens hebben om te verkopen
    await betcash.mintToken(owner.address, ethers.parseEther("1000000"));

    const ownerBalBeforeBuy = await betcash.balanceOf(owner.address);

    await betcash.connect(addr1).buy({ value: ethers.parseEther("1") });

    expect(await betcash.balanceOf(addr1.address)).to.equal(ethers.parseEther("4000"));
    expect(await betcash.balanceOf(owner.address)).to.equal(ownerBalBeforeBuy-ethers.parseEther("4000"));
  });


  it("Should not allow users to buy tokens when selling is disabled", async function () {
    await betcash.setSelling(false);
    await expect(betcash.connect(addr1).buy({ value: ethers.parseEther("1") })).to.be.reverted;
  });

  it("Should allow owner to withdraw funds", async function () {
    await betcash.connect(addr1).buy({ value: ethers.parseEther("1") });
    const initialBalance = await ethers.provider.getBalance(owner.address);

    await betcash.withdrawToOwner(ethers.parseEther("1"));
    const finalBalance = await ethers.provider.getBalance(owner.address);

    expect(finalBalance).to.be.above(initialBalance);
  });

  it("Should handle approve and transferFrom correctly", async function () {
    await betcash.approve(addr1.address, ethers.parseEther("100"));
    expect(await betcash.allowance(owner.address, addr1.address)).to.equal(ethers.parseEther("100"));

    await betcash.connect(addr1).transferFrom(owner.address, addr2.address, ethers.parseEther("50"));
    expect(await betcash.balanceOf(addr2.address)).to.equal(ethers.parseEther("50"));
    expect(await betcash.allowance(owner.address, addr1.address)).to.equal(ethers.parseEther("50"));
  });
});
