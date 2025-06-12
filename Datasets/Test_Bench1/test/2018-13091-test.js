const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("sumocoin Contract", function () {
  let sumocoin, owner, addr1, addr2;

  beforeEach(async function () {
    const Sumocoin = await ethers.getContractFactory("sumocoin");
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();
    sumocoin = await Sumocoin.deploy();
  });

  it("Should set the correct total supply and assign it to the owner", async function () {
    const totalSupply = await sumocoin.totalSupply();
    const ownerBalance = await sumocoin.balanceOf(owner.address);
    expect(totalSupply).to.equal(ethers.parseEther("10000000"));
    expect(ownerBalance).to.equal(totalSupply);
  });

  it("Should transfer tokens between accounts", async function () {
    await sumocoin.transfer(addr1.address, ethers.parseEther("100"));
    const addr1Balance = await sumocoin.balanceOf(addr1.address);
    expect(addr1Balance).to.equal(ethers.parseEther("100"));
  });

  it("Should fail if sender doesn’t have enough tokens", async function () {
    await expect(
      sumocoin.connect(addr1).transfer(addr2.address, ethers.parseEther("1"))
    ).to.be.reverted;
  });

  it("Should allow owner to mint tokens", async function () {
    await sumocoin.mintToken(addr1.address, ethers.parseEther("500"));
    const addr1Balance = await sumocoin.balanceOf(addr1.address);
    const totalSupply = await sumocoin.totalSupply();
    expect(addr1Balance).to.equal(ethers.parseEther("500"));
    expect(totalSupply).to.equal(ethers.parseEther("10000500"));
  });

  it("Should allow burning of tokens", async function () {
    await sumocoin.burn(ethers.parseEther("100"));
    const ownerBalance = await sumocoin.balanceOf(owner.address);
    const totalSupply = await sumocoin.totalSupply();
    expect(ownerBalance).to.equal(ethers.parseEther("9999900"));
    expect(totalSupply).to.equal(ethers.parseEther("9999900"));
  });

  it("Should allow burning tokens from another account with allowance", async function () {
    await sumocoin.approve(addr1.address, ethers.parseEther("200"));
    await sumocoin.connect(addr1).burnFrom(owner.address, ethers.parseEther("200"));
    const ownerBalance = await sumocoin.balanceOf(owner.address);
    const totalSupply = await sumocoin.totalSupply();
    expect(ownerBalance).to.equal(ethers.parseEther("9999800"));
    expect(totalSupply).to.equal(ethers.parseEther("9999800"));
  });

  it("Should allow owner to distribute tokens", async function () {
    const addresses = [addr1.address, addr2.address];
    await sumocoin.distributeToken(addresses, ethers.parseEther("50"));
    const addr1Balance = await sumocoin.balanceOf(addr1.address);
    const addr2Balance = await sumocoin.balanceOf(addr2.address);
    expect(addr1Balance).to.equal(ethers.parseEther("50"));
    expect(addr2Balance).to.equal(ethers.parseEther("50"));
  });

  it("Should approve and allow transferFrom", async function () {
    await sumocoin.approve(addr1.address, ethers.parseEther("100"));
    await sumocoin.connect(addr1).transferFrom(owner.address, addr2.address, ethers.parseEther("100"));
    const addr2Balance = await sumocoin.balanceOf(addr2.address);
    expect(addr2Balance).to.equal(ethers.parseEther("100"));
  });

  it("Should emit Transfer event on transfer", async function () {
    await expect(sumocoin.transfer(addr1.address, ethers.parseEther("100")))
      .to.emit(sumocoin, "Transfer")
      .withArgs(owner.address, addr1.address, ethers.parseEther("100"));
  });

  it("Should emit Burn event on burn", async function () {
    await expect(sumocoin.burn(ethers.parseEther("100")))
      .to.emit(sumocoin, "Burn")
      .withArgs(owner.address, ethers.parseEther("100"));
  });
});
