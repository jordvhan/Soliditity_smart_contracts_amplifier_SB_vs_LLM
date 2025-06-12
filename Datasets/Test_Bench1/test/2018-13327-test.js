const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ChuCunLingAIGO Contract", function () {
  let Token, token, owner, addr1, addr2;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    Token = await ethers.getContractFactory("ChuCunLingAIGO");
    token = await Token.deploy(
      ethers.parseEther("1000"), // Initial supply
      "ChuCunLingAIGO",          // Token name
      18,                        // Decimals
      "CCLA"                     // Symbol
    );
  });

  it("Should deploy with correct initial values", async function () {
    expect(await token.name()).to.equal("ChuCunLingAIGO");
    expect(await token.symbol()).to.equal("CCLA");
    expect(await token.decimals()).to.equal(18);
    expect(await token.totalSupply()).to.equal(ethers.parseEther("1000"));
    expect(await token.balanceOf(owner.address)).to.equal(ethers.parseEther("1000"));
  });

  it("Should transfer tokens between accounts", async function () {
    await token.transfer(addr1.address, ethers.parseEther("100"));
    expect(await token.balanceOf(owner.address)).to.equal(ethers.parseEther("900"));
    expect(await token.balanceOf(addr1.address)).to.equal(ethers.parseEther("100"));
  });

  it("Should return false if transfer fails", async function () {
      const initialBalanceAddr1 = await token.balanceOf(addr1.address);
      const initialBalanceAddr2 = await token.balanceOf(addr2.address);

      // Attempt to transfer more tokens than addr1 has
      const result = await token.connect(addr1).transfer(addr2.address, ethers.parseEther("1"));

      // Check that balances haven't changed because the transfer failed
      expect(await token.balanceOf(addr1.address)).to.equal(initialBalanceAddr1);
      expect(await token.balanceOf(addr2.address)).to.equal(initialBalanceAddr2);
  });



  it("Should update allowances correctly", async function () {
    await token.approve(addr1.address, ethers.parseEther("50"));
    expect(await token.allowance(owner.address, addr1.address)).to.equal(ethers.parseEther("50"));
  });

  it("Should allow approved account to transfer tokens", async function () {
    await token.approve(addr1.address, ethers.parseEther("50"));
    await token.connect(addr1).transferFrom(owner.address, addr2.address, ethers.parseEther("50"));
    expect(await token.balanceOf(owner.address)).to.equal(ethers.parseEther("950"));
    expect(await token.balanceOf(addr2.address)).to.equal(ethers.parseEther("50"));
  });

  it("Should fail transferFrom if allowance is insufficient", async function () {
      // Approve addr1 to spend 10 tokens from owner
      await token.approve(addr1.address, ethers.parseEther("10"));

      // Attempt to transfer 20 tokens, which is more than the approved amount (only 10 is allowed)
      const result = await token.connect(addr1).transferFrom(owner.address, addr2.address, ethers.parseEther("20"));

      // Verify the balances remain unchanged
      const ownerBalance = await token.balanceOf(owner.address);
      const addr2Balance = await token.balanceOf(addr2.address);
      expect(ownerBalance).to.equal(ethers.parseEther("1000")); // assuming the owner had 1000 tokens before
      expect(addr2Balance).to.equal(ethers.parseEther("0"));   // addr2 should have 0 tokens
  });

  it("Should emit Transfer event on transfer", async function () {
    await expect(token.transfer(addr1.address, ethers.parseEther("100")))
      .to.emit(token, "Transfer")
      .withArgs(owner.address, addr1.address, ethers.parseEther("100"));
  });

  it("Should emit Approval event on approve", async function () {
    await expect(token.approve(addr1.address, ethers.parseEther("50")))
      .to.emit(token, "Approval")
      .withArgs(owner.address, addr1.address, ethers.parseEther("50"));
  });
});
