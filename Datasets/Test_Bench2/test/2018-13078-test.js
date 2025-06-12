const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Jitech Contract", function () {
  let Jitech, jitech, owner, addr1, addr2;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    const initialSupply = ethers.parseEther("1000");
    Jitech = await ethers.getContractFactory("Jitech");
    jitech = await Jitech.deploy(initialSupply, "JitechToken", 18, "JTC");
  });

  it("Should set the correct owner", async function () {
    expect(await jitech.owner()).to.equal(owner.address);
  });

  it("Should transfer ownership", async function () {
    await jitech.transferOwnership(addr1.address);
    expect(await jitech.owner()).to.equal(addr1.address);
  });

  it("Should mint tokens", async function () {
    const mintAmount = ethers.parseEther("500");
    await jitech.mintToken(addr1.address, mintAmount);
    expect(await jitech.balanceOf(addr1.address)).to.equal(mintAmount);
  });

  it("Should freeze and unfreeze accounts", async function () {
    await jitech.freezeAccount(addr1.address, true);
    expect(await jitech.frozenAccount(addr1.address)).to.be.true;

    await jitech.freezeAccount(addr1.address, false);
    expect(await jitech.frozenAccount(addr1.address)).to.be.false;
  });

  it("Should transfer tokens", async function () {
    const transferAmount = ethers.parseEther("100");
    await jitech.transfer(addr1.address, transferAmount);
    expect(await jitech.balanceOf(addr1.address)).to.equal(transferAmount);
    expect(await jitech.balanceOf(owner.address)).to.equal(ethers.parseEther("900"));
  });

  it("Should not transfer tokens from frozen account", async function () {
    const transferAmount = ethers.parseEther("100");
    await jitech.freezeAccount(owner.address, true);
    await expect(jitech.transfer(addr1.address, transferAmount)).to.be.reverted;
  });

  it("Should approve and transfer tokens via transferFrom", async function () {
    const approveAmount = ethers.parseEther("200");
    const transferAmount = ethers.parseEther("100");

    await jitech.approve(addr1.address, approveAmount);
    expect(await jitech.allowance(owner.address, addr1.address)).to.equal(approveAmount);

    await jitech.connect(addr1).transferFrom(owner.address, addr2.address, transferAmount);
    expect(await jitech.balanceOf(addr2.address)).to.equal(transferAmount);
    expect(await jitech.allowance(owner.address, addr1.address)).to.equal(ethers.parseEther("100"));
  });

  it("Should not transfer tokens exceeding allowance", async function () {
    const approveAmount = ethers.parseEther("50");
    const transferAmount = ethers.parseEther("100");

    await jitech.approve(addr1.address, approveAmount);
    await expect(jitech.connect(addr1).transferFrom(owner.address, addr2.address, transferAmount)).to.be.reverted;
  });

  it("Should handle transfer to self", async function () {
    const transferAmount = ethers.parseEther("100");
    await jitech.transfer(owner.address, transferAmount);
    expect(await jitech.balanceOf(owner.address)).to.equal(ethers.parseEther("1000")); // Balance should remain the same
  });

  it("Should handle transfer of zero tokens", async function () {
    const transferAmount = ethers.parseEther("0");
    await jitech.transfer(addr1.address, transferAmount);
    expect(await jitech.balanceOf(addr1.address)).to.equal(ethers.parseEther("0"));
  });

  it("Should not allow transfer if frozen account and transferFrom is called", async function () {
    const approveAmount = ethers.parseEther("200");
    const transferAmount = ethers.parseEther("100");

    await jitech.approve(addr1.address, approveAmount);
    await jitech.freezeAccount(owner.address, true);

    await expect(jitech.connect(addr1).transferFrom(owner.address, addr2.address, transferAmount)).to.be.reverted;
  });
});
