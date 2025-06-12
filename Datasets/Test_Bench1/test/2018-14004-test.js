const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Globecoin Contract", function () {
  let Globecoin, globecoin, owner, addr1, addr2, addrs;

  beforeEach(async function () {
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();
    const GlobecoinFactory = await ethers.getContractFactory("Globecoin");
    globecoin = await GlobecoinFactory.deploy();
  });

  it("Should deploy with correct initial supply", async function () {
    const totalSupply = await globecoin.totalSupply();
    expect(totalSupply).to.equal(ethers.parseEther("0.000000014"));
  });

  it("Should assign initial balances correctly", async function () {
    const ownerBalance = await globecoin.balanceOf(owner.address);
    expect(ownerBalance).to.be.above(0);
  });

  it("Should transfer tokens correctly", async function () {
    const transferAmount = ethers.parseEther("0.00000000000001");
    await globecoin.transfer(addr1.address, transferAmount);
    const addr1Balance = await globecoin.balanceOf(addr1.address);
    expect(addr1Balance).to.equal(transferAmount);
  });

  it("Should fail transfer if balance is insufficient", async function () {
    const transferAmount = ethers.parseEther("100");
    await expect(
      globecoin.connect(addr1).transfer(addr2.address, transferAmount)
    ).to.be.revertedWithoutReason();
  });

  it("Should approve and allow transferFrom", async function () {
    const approveAmount = ethers.parseEther("0.000000000000005");
    await globecoin.approve(addr1.address, approveAmount);
    const allowance = await globecoin.allowance(owner.address, addr1.address);
    expect(allowance).to.equal(approveAmount);

    await globecoin
      .connect(addr1)
      .transferFrom(owner.address, addr2.address, approveAmount);
    const addr2Balance = await globecoin.balanceOf(addr2.address);
    expect(addr2Balance).to.equal(approveAmount);
  });

  it("Should NOT fail if non-owner tries to update variables", async function () {
    await expect(
      globecoin.connect(addr1).developer_new_price("$2.0 per GLB")
    ).to.not.reverted
  });

  it("Should distribute tokens to multiple addresses", async function () {
    const addresses = [addr1.address, addr2.address];
    await globecoin.distribute_100_tokens_to_many(addresses);
    const addr1Balance = await globecoin.balanceOf(addr1.address);
    const addr2Balance = await globecoin.balanceOf(addr2.address);
    expect(addr1Balance).to.equal(ethers.parseEther("0.0000000000001"));
    expect(addr2Balance).to.equal(ethers.parseEther("0.0000000000001"));
  });

  it("Should transfer tokens to multiple addresses after ICO", async function () {
    const addresses = [addr1.address, addr2.address];
    const transferAmount = ethers.parseEther("0.000000000000005");
    await globecoin.transfer_tokens_after_ICO(addresses, transferAmount);
    const addr1Balance = await globecoin.balanceOf(addr1.address);
    const addr2Balance = await globecoin.balanceOf(addr2.address);
    expect(addr1Balance).to.equal(transferAmount);
    expect(addr2Balance).to.equal(transferAmount);
  });
});
