const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("AditusToken", function () {
  let AditusToken, aditusToken, owner, addr1, addr2;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    const AditusTokenFactory = await ethers.getContractFactory("AditusToken");
    aditusToken = await AditusTokenFactory.deploy();
  });

  it("Should have correct initial supply and assign it to the owner", async function () {
    const totalSupply = await aditusToken.totalSupply();
    const ownerBalance = await aditusToken.balanceOf(owner.address);
    expect(totalSupply).to.equal(ethers.parseEther("1000000000"));
    expect(ownerBalance).to.equal(ethers.parseEther("1000000000"));
  });

  it("Should allow transfer of tokens", async function () {
    await aditusToken.transfer(addr1.address, ethers.parseEther("100"));
    const addr1Balance = await aditusToken.balanceOf(addr1.address);
    expect(addr1Balance).to.equal(ethers.parseEther("100"));
  });

  it("Should fail transfer if sender has insufficient balance", async function () {
    // Initial balances
    const addr1BalanceBefore = await aditusToken.balanceOf(addr1.address);
    const addr2BalanceBefore = await aditusToken.balanceOf(addr2.address);

    // Perform the transfer (which should fail due to insufficient balance)
    await aditusToken.connect(addr1).transfer(addr2.address, ethers.parseEther("100")).catch((error) => {
      // Catch the error to prevent it from breaking the test
      console.log("Expected error caught:", error.message);
    });

    // Balances after transfer
    const addr1BalanceAfter = await aditusToken.balanceOf(addr1.address);
    const addr2BalanceAfter = await aditusToken.balanceOf(addr2.address);

    // Ensure the balances of addr1 and addr2 remain the same, showing no transfer occurred
    expect(addr1BalanceBefore).to.equal(addr1BalanceAfter);
    expect(addr2BalanceBefore).to.equal(addr2BalanceAfter);
  });

  it("Should allow approval and transferFrom", async function () {
    await aditusToken.approve(addr1.address, ethers.parseEther("200"));
    const allowance = await aditusToken.allowance(owner.address, addr1.address);
    expect(allowance).to.equal(ethers.parseEther("200"));

    await aditusToken
      .connect(addr1)
      .transferFrom(owner.address, addr2.address, ethers.parseEther("100"));
    const addr2Balance = await aditusToken.balanceOf(addr2.address);
    expect(addr2Balance).to.equal(ethers.parseEther("100"));
  });

  it("Should fail transferFrom if allowance is insufficient", async function () {
    // Initial balances
    const ownerBalanceBefore = await aditusToken.balanceOf(owner.address);
    const addr2BalanceBefore = await aditusToken.balanceOf(addr2.address);

    // Check allowance to ensure it's not enough for the transfer
    const allowance = await aditusToken.allowance(owner.address, addr1.address);

    // Perform the transferFrom (which should fail due to insufficient allowance)
    await aditusToken.connect(addr1).transferFrom(owner.address, addr2.address, ethers.parseEther("100")).catch((error) => {
      // Catch the error to prevent it from breaking the test
      console.log("Expected error caught:", error.message);
    });

    // Balances after transfer
    const ownerBalanceAfter = await aditusToken.balanceOf(owner.address);
    const addr2BalanceAfter = await aditusToken.balanceOf(addr2.address);

    // Ensure the balances of owner and addr2 remain the same, showing no transfer occurred
    expect(ownerBalanceBefore).to.equal(ownerBalanceAfter);
    expect(addr2BalanceBefore).to.equal(addr2BalanceAfter);
  });

  it("Should emit Transfer event on transfer", async function () {
    await expect(aditusToken.transfer(addr1.address, ethers.parseEther("50")))
      .to.emit(aditusToken, "Transfer")
      .withArgs(owner.address, addr1.address, ethers.parseEther("50"));
  });

  it("Should emit Approval event on approve", async function () {
    await expect(aditusToken.approve(addr1.address, ethers.parseEther("150")))
      .to.emit(aditusToken, "Approval")
      .withArgs(owner.address, addr1.address, ethers.parseEther("150"));
  });
});
