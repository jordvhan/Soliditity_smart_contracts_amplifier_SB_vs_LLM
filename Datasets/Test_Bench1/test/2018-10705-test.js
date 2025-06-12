const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("AURA Contract", function () {
  let AURA, aura, owner, addr1, addr2;

  beforeEach(async function () {
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();
    const AURAContract = await ethers.getContractFactory("AURA");
    aura = await AURAContract.deploy();
  });

  it("Should deploy with the correct initial supply", async function () {
    const totalSupply = await aura.totalSupply();
    expect(totalSupply).to.equal(ethers.parseEther("1000000000"));
    const ownerBalance = await aura.balanceOf(owner.address);
    expect(ownerBalance).to.equal(totalSupply);
  });

  it("Should allow the owner to unlock tokens", async function () {
    await aura.unlockToken();
    expect(await aura.locked()).to.equal(false);
  });

  it("Should allow transfers when unlocked", async function () {
    await aura.unlockToken();
    await aura.transfer(addr1.address, ethers.parseEther("100"));
    const addr1Balance = await aura.balanceOf(addr1.address);
    expect(addr1Balance).to.equal(ethers.parseEther("100"));
  });

  it("Should not allow transfers when locked (except by owner)", async function () {
    await expect(
      aura.connect(addr1).transfer(addr2.address, ethers.parseEther("100"))
    ).to.be.reverted;
    await aura.transfer(addr1.address, ethers.parseEther("100"));
    const addr1Balance = await aura.balanceOf(addr1.address);
    expect(addr1Balance).to.equal(ethers.parseEther("100"));
  });

  it("Should allow approvals and transfers via transferFrom", async function () {
    await aura.unlockToken();
    await aura.approve(addr1.address, ethers.parseEther("200"));
    const allowance = await aura.allowance(owner.address, addr1.address);
    expect(allowance).to.equal(ethers.parseEther("200"));

    await aura.connect(addr1).transferFrom(
      owner.address,
      addr2.address,
      ethers.parseEther("150")
    );
    const addr2Balance = await aura.balanceOf(addr2.address);
    expect(addr2Balance).to.equal(ethers.parseEther("150"));
  });

  it("Should allow the owner to upload balances", async function () {
    const recipients = [addr1.address, addr2.address];
    const balances = [ethers.parseEther("100"), ethers.parseEther("200")];
    await aura.uploadBalances(recipients, balances);

    const addr1Balance = await aura.balanceOf(addr1.address);
    const addr2Balance = await aura.balanceOf(addr2.address);
    expect(addr1Balance).to.equal(ethers.parseEther("100"));
    expect(addr2Balance).to.equal(ethers.parseEther("200"));
  });

  it("Should not allow non-owner to upload balances", async function () {
    const recipients = [addr1.address];
    const balances = [ethers.parseEther("100")];
    await expect(
      aura.connect(addr1).uploadBalances(recipients, balances)
    ).to.be.reverted;
  });

  it("Should allow the owner to lock balances", async function () {
    await aura.lockBalances();
    expect(await aura.balancesUploaded()).to.equal(true);
  });

  it("Should not allow non-owner to unlock tokens", async function () {
    await expect(aura.connect(addr1).unlockToken()).to.be.reverted;
  });
});
