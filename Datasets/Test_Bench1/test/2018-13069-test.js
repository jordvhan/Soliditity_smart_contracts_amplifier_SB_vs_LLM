const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("DYC Token Contract", function () {
  let DYC, dyc, owner, addr1, addr2;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    const initialSupply = ethers.parseEther("1000");
    DYC = await ethers.getContractFactory("DYC");
    dyc = await DYC.deploy(initialSupply, "DYC Token", "DYC");
  });

  it("Should set the correct owner", async function () {
    expect(await dyc.owner()).to.equal(owner.address);
  });

  it("Should assign the total supply to the owner", async function () {
    const ownerBalance = await dyc.balanceOf(owner.address);
    expect(await dyc.totalSupply()).to.equal(ownerBalance);
  });

  it("Should transfer tokens between accounts", async function () {
    const transferAmount = ethers.parseEther("100");
    await dyc.transfer(addr1.address, transferAmount);
    expect(await dyc.balanceOf(addr1.address)).to.equal(transferAmount);
  });

  it("Should fail if sender doesn’t have enough tokens", async function () {
    const transferAmount = ethers.parseEther("100");
    await expect(dyc.connect(addr1).transfer(addr2.address, transferAmount)).to.be.reverted;
  });

  it("Should allow owner to mint tokens", async function () {
    const mintAmount = ethers.parseEther("500000000000000000000");
    await dyc.mintToken(addr1.address, mintAmount);
    expect(await dyc.balanceOf(addr1.address)).to.equal(mintAmount);
    expect(await dyc.totalSupply()).to.equal(ethers.parseEther("1500000000000000000000"));
  });

  it("Should allow owner to freeze and unfreeze accounts", async function () {
    await dyc.freezeAccount(addr1.address, true);
    expect(await dyc.frozenAccount(addr1.address)).to.be.true;

    await expect(dyc.connect(addr1).transfer(addr2.address, ethers.parseEther("10"))).to.be.reverted;

    await dyc.freezeAccount(addr1.address, false);
    expect(await dyc.frozenAccount(addr1.address)).to.be.false;
  });

  it("Should allow setting buy and sell prices", async function () {
    const buyPrice = ethers.parseEther("0.01");
    const sellPrice = ethers.parseEther("0.005");
    await dyc.setPrices(sellPrice, buyPrice);
    expect(await dyc.buyPrice()).to.equal(buyPrice);
    expect(await dyc.sellPrice()).to.equal(sellPrice);
  });

  it("Should burn tokens", async function () {
    const burnAmount = ethers.parseEther("100000000000000000000");
    await dyc.burn(burnAmount);

    expect(await dyc.totalSupply()).to.equal(ethers.parseEther("900000000000000000000"));
    expect(await dyc.balanceOf(owner.address)).to.equal(ethers.parseEther("900000000000000000000"));
  });

  it("Should burn tokens from another account", async function () {
    const burnAmount = ethers.parseEther("50000000000000000000");
    await dyc.transfer(addr1.address, burnAmount);
    await dyc.connect(addr1).approve(owner.address, burnAmount);
    await dyc.burnFrom(addr1.address, burnAmount);

    expect(await dyc.balanceOf(addr1.address)).to.equal(0);
    expect(await dyc.totalSupply()).to.equal(ethers.parseEther("950000000000000000000"));
  });
});
