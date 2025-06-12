const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("IDXM Contract", function () {
  let IDXM, idxm, owner, addr1, addr2;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    const IDXMFactory = await ethers.getContractFactory("IDXM");
    idxm = await IDXMFactory.deploy();
  });

  it("Should deploy with the correct total supply", async function () {
    const totalSupply = await idxm.totalSupply();
    expect(totalSupply).to.equal(ethers.parseEther("0.0000002")); // 200000000000 with 8 decimals
  });

  it("Should assign the total supply to the owner", async function () {
    const ownerBalance = await idxm.balanceOf(owner.address);
    const totalSupply = await idxm.totalSupply();
    expect(ownerBalance).to.equal(totalSupply);
  });

  it("Should allow the owner to transfer tokens", async function () {
    const transferAmount = ethers.parseEther("0.00000000002");

    // Log the owner's balance before transfer
    const ownerBalance = await idxm.balanceOf(owner.address);

    // Unlock the tokens before transferring
    await idxm.unlockToken();

    // Ensure the owner has enough tokens for the transfer
    expect(ownerBalance).to.be.above(transferAmount);

    await idxm.connect(owner).transfer(addr1.address, transferAmount);

    const addr1Balance = await idxm.balanceOf(addr1.address);
    expect(addr1Balance).to.equal(transferAmount);
  });


  it("Should not allow transfers when locked", async function () {
    const transferAmount = ethers.parseEther("100");
    await expect(idxm.connect(addr1).transfer(addr2.address, transferAmount)).to.be.reverted;
  });

  it("Should unlock the token and allow transfers", async function () {
    await idxm.unlockToken();
    const transferAmount = ethers.parseEther("0.00000001");
    await idxm.transfer(addr1.address, transferAmount);
    await idxm.connect(addr1).transfer(addr2.address, transferAmount);
    const addr2Balance = await idxm.balanceOf(addr2.address);
    expect(addr2Balance).to.equal(transferAmount);
  });

it("Should allow the owner to approve and transfer tokens via transferFrom", async function () {
    const transferAmount = ethers.parseEther("0.00000005");

    // Unlock the token contract so that transfers can happen
    await idxm.unlockToken();

    const addr2BalanceBefore = await idxm.balanceOf(addr2.address);

    // Ensure addr1 has enough tokens to transfer
    const transferToAddr1 = ethers.parseEther("0.0000001");  // This amount should be more than the transferAmount
    await idxm.connect(owner).transfer(addr1.address, transferToAddr1);

    // Approve the owner to transfer tokens on behalf of addr1
    await idxm.connect(addr1).approve(owner.address, transferAmount);

    await idxm.connect(owner).transferFrom(addr1.address, addr2.address, transferAmount);


    // Log final balances of addr1, addr2, and owner after the transfer
    const ownerBalanceAfter = await idxm.balanceOf(owner.address);
    const addr1BalanceAfter = await idxm.balanceOf(addr1.address);
    const addr2BalanceAfter = await idxm.balanceOf(addr2.address);

    // Check if addr2 received the correct amount
    expect(addr2BalanceAfter).to.equal(addr2BalanceBefore+transferAmount);
});



  it("Should not allow transferFrom without sufficient allowance", async function () {
    const transferAmount = ethers.parseEther("50");
    await idxm.unlockToken();
    await expect(idxm.connect(addr1).transferFrom(owner.address, addr2.address, transferAmount)).to.be.reverted;
  });

  it("Should allow the owner to set export fees", async function () {
    const fee = ethers.parseEther("0.01");
    await idxm.setExportFee(addr1.address, fee);
    const exportFee = await idxm.exportFee(addr1.address);
    expect(exportFee).to.equal(fee);
  });

  it("Should allow the owner to lock balances", async function () {
    await idxm.lockBalances();
    const balancesLocked = await idxm.balancesLocked();
    expect(balancesLocked).to.be.true;
  });

  it("Should calculate fees correctly", async function () {
    const fee = ethers.parseEther("0.01");
    await idxm.setExportFee(owner.address, fee);
    const calculatedFee = await idxm.feeFor(owner.address, addr1.address, ethers.parseEther("100"));
    expect(calculatedFee).to.equal(ethers.parseEther("10000000000")); // 100 * 0.01 (with 10 decimals)
  });

  it("Should allow the owner to set holding period", async function () {
    const newHoldingPeriod = 1209600; // 2 weeks
    await idxm.setHoldingPeriod(newHoldingPeriod);
    const holdingPeriod = await idxm.mustHoldFor();
    expect(holdingPeriod).to.equal(newHoldingPeriod);
  });
});
