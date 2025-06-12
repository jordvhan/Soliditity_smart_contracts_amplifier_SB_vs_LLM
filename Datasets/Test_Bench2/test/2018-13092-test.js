const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ReimburseToken and AdvReimburseToken", function () {
  let owner, addr1, addr2, token, advToken;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    // Deploy ReimburseToken
    const ReimburseToken = await ethers.getContractFactory("ReimburseToken");
    token = await ReimburseToken.deploy(ethers.parseEther("1000"));
    //await token.deployed();

    // Deploy AdvReimburseToken
    const AdvReimburseToken = await ethers.getContractFactory("AdvReimburseToken");
    advToken = await AdvReimburseToken.deploy(ethers.parseEther("1000"));
    //await advToken.deployed();
  });

  it("Should deploy with correct initial supply", async function () {
    const totalSupply = await token.totalSupply();
    expect(totalSupply).to.equal(ethers.parseEther("1000000000000000000000"));
    const ownerBalance = await token.balanceOf(owner.address);
    expect(ownerBalance).to.equal(ethers.parseEther("1000000000000000000000"));
  });

  it("Should transfer tokens correctly", async function () {
    await token.transfer(addr1.address, ethers.parseEther("100000000000000000000"));
    const addr1Balance = await token.balanceOf(addr1.address);
    expect(addr1Balance).to.equal(ethers.parseEther("100000000000000000000"));
    const ownerBalance = await token.balanceOf(owner.address);
    expect(ownerBalance).to.equal(ethers.parseEther("900000000000000000000"));
  });

  it("Should fail transfer if balance is insufficient", async function () {
    await expect(token.connect(addr1).transfer(addr2.address, ethers.parseEther("1"))).to.be.reverted;
  });

  it("Should approve and allow transferFrom", async function () {
    await token.approve(addr1.address, ethers.parseEther("50"));
    const allowance = await token.allowance(owner.address, addr1.address);
    expect(allowance).to.equal(ethers.parseEther("50"));

    await token.connect(addr1).transferFrom(owner.address, addr2.address, ethers.parseEther("50"));
    const addr2Balance = await token.balanceOf(addr2.address);
    expect(addr2Balance).to.equal(ethers.parseEther("50"));
  });

  it("Should fail transferFrom if allowance is insufficient", async function () {
    await expect(token.connect(addr1).transferFrom(owner.address, addr2.address, ethers.parseEther("1"))).to.be.reverted;
  });

  it("Should mint tokens correctly in AdvReimburseToken", async function () {
    await advToken.mintToken(addr1.address, ethers.parseEther("500000000000000000000"));
    const addr1Balance = await advToken.balanceOf(addr1.address);
    expect(addr1Balance).to.equal(ethers.parseEther("500000000000000000000"));
    const totalSupply = await advToken.totalSupply();
    expect(totalSupply).to.equal(ethers.parseEther("1500000000000000000000"));
  });

  it("Should prevent non-owners from minting tokens", async function () {
    await expect(advToken.connect(addr1).mintToken(addr2.address, ethers.parseEther("500"))).to.be.reverted;
  });

  it("Should prevent transfers to 0x0 address", async function () {
    const AddressZero = "0x0000000000000000000000000000000000000000";
    await expect(token.transfer(AddressZero, ethers.parseEther("100"))).to.be.reverted;
  });

  it("Should emit Transfer event on token transfer", async function () {
    await expect(token.transfer(addr1.address, ethers.parseEther("100")))
      .to.emit(token, "Transfer")
      .withArgs(owner.address, addr1.address, ethers.parseEther("100"));
  });

  it("Should emit Approval event on approve", async function () {
    await expect(token.approve(addr1.address, ethers.parseEther("50")))
      .to.emit(token, "Approval")
      .withArgs(owner.address, addr1.address, ethers.parseEther("50"));
  });

  it("Should handle transfer to self", async function () {
    const initialBalance = await token.balanceOf(owner.address);
    await token.transfer(owner.address, ethers.parseEther("10"));
    const newBalance = await token.balanceOf(owner.address);
    expect(newBalance).to.equal(initialBalance);
  });

  it("Should prevent transferFrom to 0x0 address", async function () {
    const AddressZero = "0x0000000000000000000000000000000000000000";
    await token.approve(addr1.address, ethers.parseEther("50"));
    await expect(token.connect(addr1).transferFrom(owner.address, AddressZero, ethers.parseEther("10"))).to.be.reverted;
  });

  it("Should prevent transferFrom if sender is the zero address", async function () {
    const AddressZero = "0x0000000000000000000000000000000000000000";
    await token.approve(addr1.address, ethers.parseEther("50"));
    await expect(token.connect(addr1).transferFrom(AddressZero, addr2.address, ethers.parseEther("10"))).to.be.reverted;
  });

  it("Should handle approve of zero tokens", async function () {
    await token.approve(addr1.address, ethers.parseEther("0"));
    const allowance = await token.allowance(owner.address, addr1.address);
    expect(allowance).to.equal(ethers.parseEther("0"));
  });

  it("Should handle approve to the same address", async function () {
    await token.approve(owner.address, ethers.parseEther("50"));
    const allowance = await token.allowance(owner.address, owner.address);
    expect(allowance).to.equal(ethers.parseEther("50"));
  });

  it("Should transfer max amount", async function () {
    const initialBalanceOwner = await token.balanceOf(owner.address);
    await token.transfer(addr1.address, initialBalanceOwner);
    const addr1Balance = await token.balanceOf(addr1.address);
    expect(addr1Balance).to.equal(initialBalanceOwner);
  });

  it("Should approve max amount", async function () {
    const maxAmount = ethers.MaxUint256;
    await token.approve(addr1.address, maxAmount);
    const allowance = await token.allowance(owner.address, addr1.address);
    expect(allowance).to.equal(maxAmount);
  });
});


