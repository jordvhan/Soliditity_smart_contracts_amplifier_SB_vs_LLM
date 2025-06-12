const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("BattleToken", function () {
  let BattleToken, battleToken, owner, addr1, addr2;

  beforeEach(async function () {
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();
    const BattleTokenFactory = await ethers.getContractFactory("BattleToken");
    battleToken = await BattleTokenFactory.deploy();
  });

  it("Should set the right owner", async function () {
    expect(await battleToken.owner()).to.equal(owner.address);
  });

  it("Should allow the owner to set fights address", async function () {
    await battleToken.setFightsAddress(addr1.address);
    expect(await battleToken.fights()).to.equal(addr1.address);
  });

  it("Should allow the owner to create tokens", async function () {
    await battleToken.create(100);
    expect(await battleToken.totalSupply()).to.equal(100);
    expect(await battleToken.balanceOf(owner.address)).to.equal(100);
  });

  it("Should allow transfers between accounts", async function () {
    await battleToken.create(100);
    await battleToken.transfer(addr1.address, 50);
    expect(await battleToken.balanceOf(owner.address)).to.equal(50);
    expect(await battleToken.balanceOf(addr1.address)).to.equal(50);
  });

  it("Should fail if sender does not have enough balance", async function () {
    await expect(battleToken.transfer(addr1.address, 50)).to.be.reverted;
  });

  it("Should allow batch transfers", async function () {
    await battleToken.create(100);
    await battleToken.batchTransfer([addr1.address, addr2.address], 25);
    expect(await battleToken.balanceOf(owner.address)).to.equal(50);
    expect(await battleToken.balanceOf(addr1.address)).to.equal(25);
    expect(await battleToken.balanceOf(addr2.address)).to.equal(25);
  });

  it("Should allow approvals and transferFrom", async function () {
    await battleToken.create(100);
    await battleToken.approve(addr1.address, 50);
    expect(await battleToken.allowance(owner.address, addr1.address)).to.equal(50);

    await battleToken.connect(addr1).transferFrom(owner.address, addr2.address, 50);
    expect(await battleToken.balanceOf(owner.address)).to.equal(50);
    expect(await battleToken.balanceOf(addr2.address)).to.equal(50);
  });

  it("Should fail transferFrom if allowance is insufficient", async function () {
    await battleToken.create(100);
    await battleToken.approve(addr1.address, 30);
    await expect(
      battleToken.connect(addr1).transferFrom(owner.address, addr2.address, 50)
    ).to.be.reverted;
  });

  it("Should not allow non-owner to set fights address", async function () {
    await expect(
      battleToken.connect(addr1).setFightsAddress(addr2.address)
    ).to.be.reverted;
  });

  it("Should not allow non-owner to create tokens", async function () {
    await expect(battleToken.connect(addr1).create(100)).to.be.reverted;
  });
});
