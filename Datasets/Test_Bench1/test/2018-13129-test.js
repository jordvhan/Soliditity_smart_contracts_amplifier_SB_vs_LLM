const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SPXToken", function () {
  let SPXToken, spxToken, owner, addr1, addr2, ico, migrationMaster;

  beforeEach(async function () {
    [owner, addr1, addr2, ico, migrationMaster] = await ethers.getSigners();
    const SPXTokenFactory = await ethers.getContractFactory("contracts/2018-13129.sol:SPXToken");
    spxToken = await SPXTokenFactory.deploy(ico.address, migrationMaster.address);
  });

  it("should have correct initial values", async function () {
    expect(await spxToken.name()).to.equal("SP8DE Token");
    expect(await spxToken.symbol()).to.equal("SPX");
    expect(await spxToken.decimals()).to.equal(18);
    expect(await spxToken.ico()).to.equal(ico.address);
    expect(await spxToken.migrationMaster()).to.equal(migrationMaster.address);
    expect(await spxToken.isFrozen()).to.be.true;
  });

  it("should mint tokens correctly", async function () {
    const mintAmount = ethers.parseEther("1000");
    await spxToken.connect(ico).mint(addr1.address, mintAmount);
    expect(await spxToken.balanceOf(addr1.address)).to.equal(mintAmount);
    expect(await spxToken.totalSupply()).to.equal(mintAmount);
  });

  it("should not allow non-ICO to mint tokens", async function () {
    const mintAmount = ethers.parseEther("1000");
    await expect(spxToken.connect(addr1).mint(addr1.address, mintAmount)).to.be.reverted;
  });

  it("should unfreeze the token", async function () {
    await spxToken.connect(ico).unfreeze();
    expect(await spxToken.isFrozen()).to.be.false;
  });

  it("should not allow non-ICO to unfreeze the token", async function () {
    await expect(spxToken.connect(addr1).unfreeze()).to.be.reverted;
  });

  it("should allow transfers when unfrozen", async function () {
    const mintAmount = ethers.parseEther("1000");
    const transferAmount = ethers.parseEther("500");

    await spxToken.connect(ico).mint(addr1.address, mintAmount);
    await spxToken.connect(ico).unfreeze();

    await spxToken.connect(addr1).transfer(addr2.address, transferAmount);
    expect(await spxToken.balanceOf(addr1.address)).to.equal(mintAmount-transferAmount);
    expect(await spxToken.balanceOf(addr2.address)).to.equal(transferAmount);
  });

  it("should not allow transfers when frozen", async function () {
    const mintAmount = ethers.parseEther("1000");
    const transferAmount = ethers.parseEther("500");

    await spxToken.connect(ico).mint(addr1.address, mintAmount);
    await expect(spxToken.connect(addr1).transfer(addr2.address, transferAmount)).to.be.reverted;
  });

  it("should handle approvals and allowances correctly", async function () {
    const mintAmount = ethers.parseEther("1000");
    const approveAmount = ethers.parseEther("300");

    await spxToken.connect(ico).mint(addr1.address, mintAmount);
    await spxToken.connect(ico).unfreeze();

    await spxToken.connect(addr1).approve(addr2.address, approveAmount);
    expect(await spxToken.allowance(addr1.address, addr2.address)).to.equal(approveAmount);

    const transferAmount = ethers.parseEther("200");
    await spxToken.connect(addr2).transferFrom(addr1.address, addr2.address, transferAmount);

    expect(await spxToken.balanceOf(addr1.address)).to.equal(mintAmount-transferAmount);
    expect(await spxToken.balanceOf(addr2.address)).to.equal(transferAmount);
    expect(await spxToken.allowance(addr1.address, addr2.address)).to.equal(approveAmount-transferAmount);
  });

  it("should allow migration master to update migration master", async function () {
    await spxToken.connect(migrationMaster).setMigrationMaster(addr1.address);
    expect(await spxToken.migrationMaster()).to.equal(addr1.address);
  });

  it("should not allow non-migration master to update migration master", async function () {
    await expect(spxToken.connect(addr1).setMigrationMaster(addr2.address)).to.be.reverted;
  });
});
