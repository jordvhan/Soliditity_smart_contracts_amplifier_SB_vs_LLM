const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("WMCToken Contract", function () {
  let WMCToken, wmctoken, owner, addr1, addr2, addr3;

  beforeEach(async function () {
    [owner, addr1, addr2, addr3, ...addrs] = await ethers.getSigners();
    WMCToken = await ethers.getContractFactory("WMCToken");
    wmctoken = await WMCToken.deploy(
      ethers.parseEther("1000"), // initial supply
      "WMC Token",              // token name
      "WMC"                     // token symbol
    );
  });

  it("Should deploy with correct initial values", async function () {
    expect(await wmctoken.name()).to.equal("WMC Token");
    expect(await wmctoken.symbol()).to.equal("WMC");
    expect(await wmctoken.decimals()).to.equal(18);
    expect(await wmctoken.totalSupply()).to.equal(ethers.parseEther("1000000000000000000000"));
    expect(await wmctoken.balanceOf(owner.address)).to.equal(ethers.parseEther("1000000000000000000000"));
  });

  it("Should transfer tokens between accounts", async function () {
    await wmctoken.transfer(addr1.address, ethers.parseEther("100000000000000000000"));
    expect(await wmctoken.balanceOf(addr1.address)).to.equal(ethers.parseEther("100000000000000000000"));
    expect(await wmctoken.balanceOf(owner.address)).to.equal(ethers.parseEther("900000000000000000000"));
  });

  it("Should fail if sender does not have enough balance", async function () {
    await expect(
      wmctoken.connect(addr1).transfer(addr2.address, ethers.parseEther("1"))
    ).to.be.revertedWithoutReason();
  });

  it("Should allow burning tokens", async function () {
    await wmctoken.burn(ethers.parseEther("100000000000000000000"));
    expect(await wmctoken.totalSupply()).to.equal(ethers.parseEther("900000000000000000000"));
    expect(await wmctoken.balanceOf(owner.address)).to.equal(ethers.parseEther("900000000000000000000"));
  });

  it("Should allow burning tokens from another account with allowance", async function () {
    await wmctoken.approve(addr1.address, ethers.parseEther("50000000000000000000"));
    await wmctoken.connect(addr1).burnFrom(owner.address, ethers.parseEther("50000000000000000000"));
    expect(await wmctoken.totalSupply()).to.equal(ethers.parseEther("950000000000000000000"));
    expect(await wmctoken.balanceOf(owner.address)).to.equal(ethers.parseEther("950000000000000000000"));
  });

  it("Should freeze and unfreeze accounts", async function () {
    await wmctoken.freezeAccount(addr1.address, true);
    expect(await wmctoken.frozenAccount(addr1.address)).to.be.true;

    await expect(
      wmctoken.connect(addr1).transfer(addr2.address, ethers.parseEther("1"))
    ).to.be.revertedWithoutReason();

    await wmctoken.freezeAccount(addr1.address, false);
    expect(await wmctoken.frozenAccount(addr1.address)).to.be.false;
  });

  it("Should perform batch transfers", async function () {
    const receivers = [addr1.address, addr2.address, addr3.address];
    const value = ethers.parseEther("10000000000000000000");

    await wmctoken.batchTransfer(receivers, value);

    for (const receiver of receivers) {
      expect(await wmctoken.balanceOf(receiver)).to.equal(value);
    }
    expect(await wmctoken.balanceOf(owner.address)).to.equal(ethers.parseEther("970000000000000000000"));
  });

  it("Should fail batch transfer if sender has insufficient balance", async function () {
    const receivers = [addr1.address, addr2.address, addr3.address];
    const value = ethers.parseEther("500000000000000000000");

    await expect(wmctoken.batchTransfer(receivers, value)).to.be.revertedWithoutReason();
  });

  it("Should fail batch transfer if sender is frozen", async function () {
    const receivers = [addr1.address, addr2.address];
    const value = ethers.parseEther("10");

    await wmctoken.freezeAccount(owner.address, true);
    await expect(wmctoken.batchTransfer(receivers, value)).to.be.revertedWithoutReason();
  });
});
