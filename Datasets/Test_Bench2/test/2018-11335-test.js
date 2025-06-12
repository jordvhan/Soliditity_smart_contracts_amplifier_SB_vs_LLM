const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SPXToken", function () {
  let SPXToken, spxToken, owner, addr1, addr2, migrationMaster;

  beforeEach(async function () {
    [owner, addr1, addr2, migrationMaster] = await ethers.getSigners();
    const ICO = owner.address;
    SPXToken = await ethers.getContractFactory("contracts/2018-11335.sol:SPXToken");
    spxToken = await SPXToken.deploy(ICO, migrationMaster.address);
  });

  it("should deploy with correct initial values", async function () {
    expect(await spxToken.name()).to.equal("SP8DE Token");
    expect(await spxToken.symbol()).to.equal("SPX");
    expect(await spxToken.decimals()).to.equal(18);
    expect(await spxToken.ico()).to.equal(owner.address);
    expect(await spxToken.isFrozen()).to.be.true;
  });

  it("should mint tokens correctly", async function () {
    const mintAmount = ethers.parseEther("1000");
    await spxToken.mint(addr1.address, mintAmount);
    expect(await spxToken.balanceOf(addr1.address)).to.equal(mintAmount);
    expect(await spxToken.totalSupply()).to.equal(mintAmount);
  });

  it("should unfreeze the token", async function () {
    await spxToken.unfreeze();
    expect(await spxToken.isFrozen()).to.be.false;
  });

  it("should not allow transfers when frozen", async function () {
    const mintAmount = ethers.parseEther("1000");
    await spxToken.mint(addr1.address, mintAmount);
    await expect(spxToken.connect(addr1).transfer(addr2.address, mintAmount)).to.be.reverted;
  });

  it("should allow transfers when unfrozen", async function () {
    const mintAmount = ethers.parseEther("1000");
    await spxToken.mint(addr1.address, mintAmount);
    await spxToken.unfreeze();
    await spxToken.connect(addr1).transfer(addr2.address, mintAmount);
    expect(await spxToken.balanceOf(addr2.address)).to.equal(mintAmount);
  });

  it("should approve and allow transferFrom", async function () {
    const mintAmount = ethers.parseEther("1000");
    const transferAmount = ethers.parseEther("500");
    await spxToken.mint(addr1.address, mintAmount);
    await spxToken.unfreeze();
    await spxToken.connect(addr1).approve(addr2.address, transferAmount);
    expect(await spxToken.allowance(addr1.address, addr2.address)).to.equal(transferAmount);
    await spxToken.connect(addr2).transferFrom(addr1.address, addr2.address, transferAmount);
    expect(await spxToken.balanceOf(addr2.address)).to.equal(transferAmount);
  });

  it("should not allow non-migrationMaster to set migration agent", async function () {
    await expect(spxToken.connect(addr1).setMigrationAgent(addr2.address)).to.be.reverted;
  });

  it("should not allow non-ICO to mint tokens", async function () {
    const mintAmount = ethers.parseEther("1000");
    await expect(spxToken.connect(addr1).mint(addr1.address, mintAmount)).to.be.reverted;
  });
});
