const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("NewIntelTechMedia Contract", function () {
  let owner, addr1, addr2, addr3, contract;

  beforeEach(async function () {
    [owner, addr1, addr2, addr3] = await ethers.getSigners();
    const Contract = await ethers.getContractFactory("NewIntelTechMedia");
    contract = await Contract.deploy();

    await contract.NETM();
  });

  it("Should deploy with correct initial values", async function () {
    expect(await contract.name()).to.equal("NewIntelTechMedia");
    expect(await contract.symbol()).to.equal("NETM");
    expect(await contract.decimals()).to.equal(18);
    expect(await contract.totalSupply()).to.equal(ethers.parseEther("500000000"));
    expect(await contract.totalDistributed()).to.equal(ethers.parseEther("250000000"));
  });

  it("Should allow owner to transfer ownership", async function () {
    await contract.transferOwnership(addr1.address);
    expect(await contract.owner()).to.equal(addr1.address);

    // Transfer ownership back to the original owner for subsequent tests
    await contract.connect(addr1).transferOwnership(owner.address);
    expect(await contract.owner()).to.equal(owner.address);
  });

  it("Should distribute tokens correctly", async function () {
    const initialOwnerBalance = await contract.balanceOf(owner.address);
    await contract.getTokens({ value: ethers.parseEther("0") });
    const finalOwnerBalance = await contract.balanceOf(owner.address);
    expect(finalOwnerBalance).to.be.gt(initialOwnerBalance);
  });

  it("Should allow token transfers", async function () {
    const initialOwnerBalance = await contract.balanceOf(owner.address);
    const transferAmount = ethers.parseEther("100");
    await contract.transfer(addr1.address, transferAmount);
    expect(await contract.balanceOf(addr1.address)).to.equal(transferAmount);
    expect(await contract.balanceOf(owner.address)).to.equal(initialOwnerBalance - transferAmount);

    // Transfer tokens back to the owner for subsequent tests
    await contract.connect(addr1).transfer(owner.address, transferAmount);
  });

  it("Should allow approvals and transfers via transferFrom", async function () {
    const initialOwnerBalance = await contract.balanceOf(owner.address);
    const initialAddr2Balance = await contract.balanceOf(addr2.address);
    const approveAmount = ethers.parseEther("50");
    await contract.approve(addr1.address, approveAmount);
    expect(await contract.allowance(owner.address, addr1.address)).to.equal(approveAmount);

    await contract.connect(addr1).transferFrom(owner.address, addr2.address, approveAmount);
    expect(await contract.balanceOf(addr2.address)).to.equal(initialAddr2Balance + approveAmount);
    expect(await contract.balanceOf(owner.address)).to.equal(initialOwnerBalance - approveAmount);

    // Transfer tokens back to the owner for subsequent tests
    await contract.connect(addr2).transfer(owner.address, approveAmount);
  });

  it("Should allow burning tokens", async function () {
    const initialTotalSupply = await contract.totalSupply();
    const initialOwnerBalance = await contract.balanceOf(owner.address);
    const burnAmount = ethers.parseEther("100");
    await contract.burn(burnAmount);
    expect(await contract.totalSupply()).to.equal(initialTotalSupply - burnAmount);
    expect(await contract.balanceOf(owner.address)).to.equal(initialOwnerBalance - burnAmount);
  });

  it("Should prevent blacklisted addresses from getting tokens", async function () {
    await contract.connect(addr1).getTokens({ value: ethers.parseEther("0") }); // eerste keer: whitelist
    await expect(contract.connect(addr1).getTokens({ value: ethers.parseEther("0") })).to.be.reverted; // tweede keer: blacklist
  });

  it("Should finish token distribution", async function () {
    await contract.finishDistribution();
    expect(await contract.distributionFinished()).to.be.true;
  });
});
