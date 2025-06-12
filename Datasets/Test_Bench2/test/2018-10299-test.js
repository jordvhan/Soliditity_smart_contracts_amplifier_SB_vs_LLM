const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("BecToken", function () {
  let BecToken, becToken, owner, addr1, addr2, addr3;

  beforeEach(async function () {
    [owner, addr1, addr2, addr3] = await ethers.getSigners();
    const BecTokenFactory = await ethers.getContractFactory("contracts/2018-10299.sol:BecToken");
    becToken = await BecTokenFactory.deploy();
  });

  it("should initialize with correct total supply and assign it to the owner", async function () {
    const totalSupply = await becToken.totalSupply();
    const ownerBalance = await becToken.balanceOf(owner.address);
    expect(totalSupply).to.equal(ownerBalance);
  });

  it("should allow transfer of tokens", async function () {
    const transferAmount = ethers.parseEther("100");
    await becToken.transfer(addr1.address, transferAmount);
    const addr1Balance = await becToken.balanceOf(addr1.address);
    expect(addr1Balance).to.equal(transferAmount);
  });

  it("should not allow transfer of tokens exceeding balance", async function () {
    const transferAmount = ethers.parseEther("100");
    await expect(
      becToken.connect(addr1).transfer(addr2.address, transferAmount)
    ).to.be.reverted;
  });

  it("should allow owner to pause and unpause the contract", async function () {
    await becToken.pause();
    expect(await becToken.paused()).to.be.true;

    await expect(
      becToken.transfer(addr1.address, ethers.parseEther("100"))
    ).to.be.reverted;

    await becToken.unpause();
    expect(await becToken.paused()).to.be.false;

    await becToken.transfer(addr1.address, ethers.parseEther("100"));
    const addr1Balance = await becToken.balanceOf(addr1.address);
    expect(addr1Balance).to.equal(ethers.parseEther("100"));
  });

  it("should allow batch transfer of tokens", async function () {
    const receivers = [addr1.address, addr2.address, addr3.address];
    const transferAmount = ethers.parseEther("10");
    const totalAmount = ethers.parseEther("30");

    await becToken.batchTransfer(receivers, transferAmount);

    for (const receiver of receivers) {
      const balance = await becToken.balanceOf(receiver);
      expect(balance).to.equal(transferAmount);
    }

    const ownerBalance = await becToken.balanceOf(owner.address);
    expect(ownerBalance).to.equal((await becToken.totalSupply())-totalAmount);
  });

  it("should not allow batch transfer exceeding balance", async function () {
    const receivers = [addr1.address, addr2.address, addr3.address];
    const transferAmount = ethers.parseEther("10000000000"); // Exceeds balance

    const addr1BalanceBefore = await becToken.balanceOf(addr1.address);
    const addr2BalanceBefore = await becToken.balanceOf(addr2.address);
    const addr3BalanceBefore = await becToken.balanceOf(addr3.address);

    await expect(
      becToken.batchTransfer(receivers, transferAmount)
    ).to.be.ok;

    // Store balances of all receivers after the transfer
    const addr1BalanceAfter = await becToken.balanceOf(addr1.address);
    const addr2BalanceAfter = await becToken.balanceOf(addr2.address);
    const addr3BalanceAfter = await becToken.balanceOf(addr3.address);

    // Assert that the balances of the receivers have not changed
    expect(addr1BalanceBefore).to.equal(addr1BalanceAfter);
    expect(addr2BalanceBefore).to.equal(addr2BalanceAfter);
    expect(addr3BalanceBefore).to.equal(addr3BalanceAfter);
  });

  it("Should revert batchTransfer if sender has insufficient balance", async function () {
    const receivers = [addr1.address, addr2.address, addr3.address];
    const transferAmount = ethers.parseEther("10000000000"); // Exceeds balance
    await expect(
      becToken.batchTransfer(receivers, transferAmount)
    ).to.be.reverted;
  });

  it("should allow approval and transferFrom", async function () {
    const approveAmount = ethers.parseEther("50");
    const transferAmount = ethers.parseEther("30");

    await becToken.approve(addr1.address, approveAmount);
    const allowance = await becToken.allowance(owner.address, addr1.address);
    expect(allowance).to.equal(approveAmount);

    await becToken.connect(addr1).transferFrom(owner.address, addr2.address, transferAmount);
    const addr2Balance = await becToken.balanceOf(addr2.address);
    expect(addr2Balance).to.equal(transferAmount);

    const remainingAllowance = await becToken.allowance(owner.address, addr1.address);
    expect(remainingAllowance).to.equal(approveAmount-transferAmount);
  });

  it("should not allow transferFrom exceeding allowance", async function () {
    const approveAmount = ethers.parseEther("50");
    const transferAmount = ethers.parseEther("60");

    await becToken.approve(addr1.address, approveAmount);

    await expect(
      becToken.connect(addr1).transferFrom(owner.address, addr2.address, transferAmount)
    ).to.be.reverted;
  });
});

describe("Extended tests for BecToken", function () {
  let BecToken, becToken, owner, addr1, addr2, addr3, addr4;

  beforeEach(async function () {
    [owner, addr1, addr2, addr3, addr4] = await ethers.getSigners();
    const BecTokenFactory = await ethers.getContractFactory("contracts/2018-10299.sol:BecToken");
    becToken = await BecTokenFactory.deploy();
  });

  it("should not allow transfer to the zero address", async function () {
    const transferAmount = ethers.parseEther("10");
    await expect(
      becToken.transfer(ethers.ZeroAddress, transferAmount)
    ).to.be.reverted;
  });

  it("should only allow owner to pause/unpause", async function () {
    await expect(
      becToken.connect(addr1).pause()
    ).to.be.reverted;
    await becToken.pause();
    await expect(
      becToken.connect(addr1).unpause()
    ).to.be.reverted;
    await becToken.unpause();
  });

  it("should reject batchTransfer when receivers count exceeds limit", async function () {
    // Create an array of 21 addresses (exceed limit 20)
    const receivers = [];
    for (let i = 0; i < 21; i++) {
      receivers.push(addr1.address);
    }
    const transferAmount = ethers.parseEther("1");
    await expect(
      becToken.batchTransfer(receivers, transferAmount)
    ).to.be.reverted;
  });
  
  it("should allow ownership transfer and restrict owner-only functions", async function () {
    // Transfer ownership to addr1
    await becToken.transferOwnership(addr1.address);
    // Previous owner should not be able to pause now.
    await expect(
      becToken.pause()
    ).to.be.reverted;
    // New owner can pause the contract.
    await becToken.connect(addr1).pause();
    expect(await becToken.paused()).to.be.true;
  });
  
  it("should revert transferFrom if sender has insufficient allowance", async function () {
    const approveAmount = ethers.parseEther("20");
    const transferAmount = ethers.parseEther("30");
    await becToken.approve(addr1.address, approveAmount);
    await expect(
      becToken.connect(addr1).transferFrom(owner.address, addr2.address, transferAmount)
    ).to.be.reverted;
  });
});
