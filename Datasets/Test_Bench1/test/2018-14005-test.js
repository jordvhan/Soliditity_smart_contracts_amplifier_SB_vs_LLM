const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MalaysianCoin Contract", function () {
  let MalaysianCoin, malaysianCoin, owner, addr1, addr2, addrs;

  beforeEach(async function () {
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();
    const MalaysianCoinFactory = await ethers.getContractFactory("MalaysianCoin");
    malaysianCoin = await MalaysianCoinFactory.deploy();
  });

  it("Should set the correct initial supply and balances", async function () {
    const hardcoded_initial_supply = ethers.parseEther("0.000000020000020004");
    const hardcoded_start_balance = ethers.parseEther("0.000000002499989998");
    expect(await malaysianCoin.totalSupply()).to.equal(hardcoded_initial_supply);
    expect(await malaysianCoin.balanceOf(owner.address)).to.equal(hardcoded_start_balance);
  });

  it("Should allow increaseApproval and decreaseApproval", async function () {
    const approveAmount = ethers.parseEther("10");
    await malaysianCoin.increaseApproval(addr1.address, approveAmount);
    expect(await malaysianCoin.allowance(owner.address, addr1.address)).to.equal(approveAmount);

    const decreaseAmount = ethers.parseEther("5");
    await malaysianCoin.decreaseApproval(addr1.address, decreaseAmount);
    expect(await malaysianCoin.allowance(owner.address, addr1.address)).to.equal(
      approveAmount - decreaseAmount
    );
  });

  it("Should allow batch transfers with transferAUTOtokens10", async function () {
    const addresses = [addr1.address, addr2.address];
    await malaysianCoin.transferAUTOtokens10(addresses);
    expect(await malaysianCoin.balanceOf(addr1.address)).to.equal(ethers.parseEther("0.00000000000001"));
    expect(await malaysianCoin.balanceOf(addr2.address)).to.equal(ethers.parseEther("0.00000000000001"));
  });

  it("Should allow batch transfers with transferAUTOtokens5", async function () {
    const addresses = [addr1.address, addr2.address];
    await malaysianCoin.transferAUTOtokens5(addresses);
    expect(await malaysianCoin.balanceOf(addr1.address)).to.equal(ethers.parseEther("0.000000000000005"));
    expect(await malaysianCoin.balanceOf(addr2.address)).to.equal(ethers.parseEther("0.000000000000005"));
  });

  it("Should allow batch transfers with transferAUTOtoken1", async function () {
    const addresses = [addr1.address, addr2.address];
    await malaysianCoin.transferAUTOtoken1(addresses);
    expect(await malaysianCoin.balanceOf(addr1.address)).to.equal(ethers.parseEther("0.000000000000001"));
    expect(await malaysianCoin.balanceOf(addr2.address)).to.equal(ethers.parseEther("0.000000000000001"));
  });

  it("Should allow batch transfers with transferAny", async function () {
    const addresses = [addr1.address, addr2.address];
    const transferAmount = ethers.parseEther("0.000000000000002");
    await malaysianCoin.transferAny(addresses, transferAmount);
    expect(await malaysianCoin.balanceOf(addr1.address)).to.equal(transferAmount);
    expect(await malaysianCoin.balanceOf(addr2.address)).to.equal(transferAmount);
  });

  it("Should revert transfers exceeding balance", async function () {
    const transferAmount = ethers.parseEther("1000000");
    await expect(malaysianCoin.transfer(addr1.address, transferAmount)).to.be.revertedWithoutReason();
  });

  it("Should revert batch transfers exceeding balance", async function () {
    const addresses = [addr1.address, addr2.address];
    const transferAmount = ethers.parseEther("1000000");
    await expect(malaysianCoin.transferAny(addresses, transferAmount)).to.be.revertedWithoutReason();
  });
});
