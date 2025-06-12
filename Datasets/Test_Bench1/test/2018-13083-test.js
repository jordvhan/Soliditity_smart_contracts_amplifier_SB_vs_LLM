const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("PlazaToken", function () {
  let PlazaToken, plazaToken, owner, addr1, addr2;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    const initialSupply = ethers.parseEther("1000");
    PlazaToken = await ethers.getContractFactory("PlazaToken");
    plazaToken = await PlazaToken.deploy(initialSupply, "PlazaToken", "PLZ");
  });

  it("Should set the correct owner", async function () {
    expect(await plazaToken.owner()).to.equal(owner.address);
  });

  it("Should initialize with correct total supply", async function () {
    const totalSupply = await plazaToken.totalSupply();
    expect(totalSupply).to.equal(ethers.parseEther("1000000000000000000000"));
    expect(await plazaToken.balanceOf(owner.address)).to.equal(totalSupply);
  });

  it("Should transfer tokens between accounts", async function () {
    await plazaToken.transfer(addr1.address, ethers.parseEther("100000000000000000000"));
    expect(await plazaToken.balanceOf(addr1.address)).to.equal(ethers.parseEther("100000000000000000000"));
    expect(await plazaToken.balanceOf(owner.address)).to.equal(ethers.parseEther("900000000000000000000"));
  });

  it("Should fail if sender doesn’t have enough tokens", async function () {
    await expect(
      plazaToken.connect(addr1).transfer(addr2.address, ethers.parseEther("1"))
    ).to.be.reverted;
  });

  it("Should allow owner to mint tokens", async function () {
    await plazaToken.mintToken(addr1.address, ethers.parseEther("500000000000000000000"));
    expect(await plazaToken.balanceOf(addr1.address)).to.equal(ethers.parseEther("500000000000000000000"));
    expect(await plazaToken.totalSupply()).to.equal(ethers.parseEther("1500000000000000000000"));
  });

  it("Should allow owner to freeze and unfreeze accounts", async function () {
    await plazaToken.freezeAccount(addr1.address, true);
    await expect(
      plazaToken.connect(addr1).transfer(addr2.address, ethers.parseEther("1"))
    ).to.be.reverted;
    await plazaToken.freezeAccount(addr1.address, false);
    await plazaToken.transfer(addr1.address, ethers.parseEther("100"));
    await plazaToken.connect(addr1).transfer(addr2.address, ethers.parseEther("50"));
    expect(await plazaToken.balanceOf(addr2.address)).to.equal(ethers.parseEther("50"));
  });

  it("Should allow burning tokens", async function () {
    await plazaToken.burn(ethers.parseEther("100000000000000000000"));
    expect(await plazaToken.totalSupply()).to.equal(ethers.parseEther("900000000000000000000"));
    expect(await plazaToken.balanceOf(owner.address)).to.equal(ethers.parseEther("900000000000000000000"));
  });

  it("Should allow burning tokens from another account with allowance", async function () {
    await plazaToken.transfer(addr1.address, ethers.parseEther("100000000000000000000"));
    await plazaToken.connect(addr1).approve(owner.address, ethers.parseEther("50000000000000000000"));
    await plazaToken.burnFrom(addr1.address, ethers.parseEther("50000000000000000000"));
    expect(await plazaToken.balanceOf(addr1.address)).to.equal(ethers.parseEther("50000000000000000000"));
    expect(await plazaToken.totalSupply()).to.equal(ethers.parseEther("950000000000000000000"));
  });

  it("Should approve and allow transferFrom", async function () {
    await plazaToken.approve(addr1.address, ethers.parseEther("100000000000000000000"));
    await plazaToken.connect(addr1).transferFrom(owner.address, addr2.address, ethers.parseEther("50000000000000000000"));
    expect(await plazaToken.balanceOf(addr2.address)).to.equal(ethers.parseEther("50000000000000000000"));
    expect(await plazaToken.balanceOf(owner.address)).to.equal(ethers.parseEther("950000000000000000000"));
  });
});
