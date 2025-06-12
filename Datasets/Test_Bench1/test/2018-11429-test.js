const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ATL Contract", function () {
  let ATL, atl, owner, ico, addr1, addr2;

  beforeEach(async function () {
    [owner, ico, addr1, addr2] = await ethers.getSigners();
    const ATLContract = await ethers.getContractFactory("ATL");
    atl = await ATLContract.deploy(ico.address);
  });

  it("Should set the correct ICO address", async function () {
    expect(await atl.ico()).to.equal(ico.address);
  });

  it("Should mint tokens correctly", async function () {
    const mintAmount = ethers.parseEther("100");
    await atl.connect(ico).mint(addr1.address, mintAmount);
    expect(await atl.balanceOf(addr1.address)).to.equal(mintAmount);
    expect(await atl.totalSupply()).to.equal(mintAmount);
  });

  it("Should not allow non-ICO to mint tokens", async function () {
    const mintAmount = ethers.parseEther("100");
    await expect(atl.connect(addr1).mint(addr1.address, mintAmount)).to.be.reverted;
  });

  it("Should unfreeze tokens correctly", async function () {
    await atl.connect(ico).unfreeze();
    expect(await atl.tokensAreFrozen()).to.be.false;
  });

  it("Should not allow transfers when tokens are frozen", async function () {
    const mintAmount = ethers.parseEther("100");
    await atl.connect(ico).mint(addr1.address, mintAmount);
    await expect(atl.connect(addr1).transfer(addr2.address, ethers.parseEther("10"))).to.be.reverted;
  });

  it("Should allow transfers when tokens are unfrozen", async function () {
    const mintAmount = ethers.parseEther("100");
    await atl.connect(ico).mint(addr1.address, mintAmount);
    await atl.connect(ico).unfreeze();
    await atl.connect(addr1).transfer(addr2.address, ethers.parseEther("10"));
    expect(await atl.balanceOf(addr1.address)).to.equal(ethers.parseEther("90"));
    expect(await atl.balanceOf(addr2.address)).to.equal(ethers.parseEther("10"));
  });

  it("Should allow transferFrom when tokens are unfrozen", async function () {
    const mintAmount = ethers.parseEther("100");
    await atl.connect(ico).mint(addr1.address, mintAmount);
    await atl.connect(ico).unfreeze();
    await atl.connect(addr1).approve(addr2.address, ethers.parseEther("50"));
    await atl.connect(addr2).transferFrom(addr1.address, addr2.address, ethers.parseEther("20"));
    expect(await atl.balanceOf(addr1.address)).to.equal(ethers.parseEther("80"));
    expect(await atl.balanceOf(addr2.address)).to.equal(ethers.parseEther("20"));
  });

  it("Should not allow minting beyond the token limit", async function () {
    const tokenLimit = ethers.parseEther("150000000");
    await atl.connect(ico).mint(addr1.address, tokenLimit);
    await expect(atl.connect(ico).mint(addr1.address, ethers.parseEther("1"))).to.be.reverted;
  });
});
