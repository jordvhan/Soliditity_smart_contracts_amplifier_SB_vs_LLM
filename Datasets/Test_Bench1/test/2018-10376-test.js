const { expect } = require("chai");
const { ethers } = require("hardhat");
const {defaultAbiCoder} = require("@ethersproject/abi");
const {splitSignature} = require("@ethersproject/bytes");
const { keccak256 } = require("ethers");


describe("SMT Contract", function () {
  let SMT, smt, owner, addr1, addr2, addr3;

  beforeEach(async function () {
    [owner, addr1, addr2, addr3] = await ethers.getSigners();
    const SMTFactory = await ethers.getContractFactory("SMT");
    smt = await SMTFactory.deploy();
  });

  it("Should deploy with correct initial values", async function () {
    expect(await smt.name()).to.equal("SmartMesh Token");
    expect(await smt.symbol()).to.equal("SMT");
    expect(await smt.decimals()).to.equal(18);
  });

  it("Should allow the owner to allocate tokens", async function () {
    const owners = [addr1.address, addr2.address];
    const values = [ethers.parseEther("100"), ethers.parseEther("200")];

    await smt.allocateTokens(owners, values);

    expect(await smt.balanceOf(addr1.address)).to.equal(ethers.parseEther("100"));
    expect(await smt.balanceOf(addr2.address)).to.equal(ethers.parseEther("200"));
  });

  it("Should revert allocation after the allocation period ends", async function () {
    await ethers.provider.send("evm_increaseTime", [24 * 60 * 60]); // Increase time by 1 day
    await ethers.provider.send("evm_mine");

    const owners = [addr1.address];
    const values = [ethers.parseEther("100")];

    await expect(smt.allocateTokens(owners, values)).to.be.reverted;
  });

  it("Should allow token transfers when enabled", async function () {
    await smt.allocateTokens([addr1.address], [ethers.parseEther("100")]);
    await smt.enableTransfer(true);

    await smt.connect(addr1).transfer(addr2.address, ethers.parseEther("50"));

    expect(await smt.balanceOf(addr1.address)).to.equal(ethers.parseEther("50"));
    expect(await smt.balanceOf(addr2.address)).to.equal(ethers.parseEther("50"));
  });

  it("Should not allow token transfers when disabled", async function () {
    await smt.allocateTokens([addr1.address], [ethers.parseEther("100")]);

    await expect(
      smt.connect(addr1).transfer(addr2.address, ethers.parseEther("50"))
    ).to.be.reverted;
  });

  it("Should revert approveProxy if signature is invalid", async function () {
    const feeSmt = 5;
    const nonce = await smt.getNonce(owner.address);

    // Use ethers.utils.defaultAbiCoder to encode the parameters into the correct format
    const encodedData = defaultAbiCoder.encode(
      ["address", "address", "uint256", "uint256", "uint256"],
      [owner.address, addr1.address, 100, nonce, feeSmt]
    );

    // Create the message hash (keccak256 of the encoded data)
    const msgHash = keccak256(encodedData);

    // Sign the message with an incorrect signer (addr1 instead of owner)
    const sign = await addr1.signMessage(ethers.hexlify(ethers.toUtf8Bytes(msgHash))); // Use hexlify and toUtf8Bytes
    const { r, s, v } = splitSignature(sign);

    // Expect the transaction to revert with the invalid signature
    await expect(smt.approveProxy(owner.address, addr1.address, 100, v, r, s)).to.be.reverted;
  });

  it("Should allow the owner to change ownership", async function () {
    await smt.changeOwner(addr1.address);
    await smt.connect(addr1).acceptOwnership();

    expect(await smt.owner()).to.equal(addr1.address);
  });

  it("Should allow approvals and allowance checks", async function () {
    await smt.allocateTokens([addr1.address], [ethers.parseEther("100")]);

    await smt.connect(addr1).approve(addr2.address, ethers.parseEther("50"));

    expect(await smt.allowance(addr1.address, addr2.address)).to.equal(ethers.parseEther("50"));
  });

  it("Should allow transfers via transferFrom", async function () {
    await smt.allocateTokens([addr1.address], [ethers.parseEther("100")]);
    await smt.enableTransfer(true);

    await smt.connect(addr1).approve(addr2.address, ethers.parseEther("50"));
    await smt.connect(addr2).transferFrom(addr1.address, addr3.address, ethers.parseEther("50"));

    expect(await smt.balanceOf(addr1.address)).to.equal(ethers.parseEther("50"));
    expect(await smt.balanceOf(addr3.address)).to.equal(ethers.parseEther("50"));
  });

it("Should not allow transferFrom if allowance is insufficient", async function () {
    // Allocate tokens to addr1
    await smt.allocateTokens([addr1.address], [ethers.parseEther("100")]);

    // Enable transfers
    await smt.enableTransfer(true);

    // Addr1 approves addr2 to transfer 30 tokens on its behalf
    await smt.connect(addr1).approve(addr2.address, ethers.parseEther("30"));

    // Check balances before transfer
    const addr1BalanceBefore = await smt.balanceOf(addr1.address);
    const addr2BalanceBefore = await smt.balanceOf(addr2.address);
    const addr3BalanceBefore = await smt.balanceOf(addr3.address);

    // Try to transfer more than the approved allowance (50 tokens) from addr1 to addr3 by addr2
    await smt.connect(addr2).transferFrom(addr1.address, addr3.address, ethers.parseEther("50"));

    // Check balances after the attempted transfer
    const addr1BalanceAfter = await smt.balanceOf(addr1.address);
    const addr2BalanceAfter = await smt.balanceOf(addr2.address);
    const addr3BalanceAfter = await smt.balanceOf(addr3.address);

    // Assert that balances have not changed if the transfer should not occur
    expect(addr1BalanceBefore).to.equal(addr1BalanceAfter);
    expect(addr2BalanceBefore).to.equal(addr2BalanceAfter);
    expect(addr3BalanceBefore).to.equal(addr3BalanceAfter);
});

});
