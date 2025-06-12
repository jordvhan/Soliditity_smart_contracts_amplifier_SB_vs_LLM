const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Tracto Contract", function () {
  let Tracto, tracto, owner, addr1, addr2;

  beforeEach(async function () {
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();
    const TractoFactory = await ethers.getContractFactory("Tracto");
    tracto = await TractoFactory.deploy();
  });

  it("Should deploy with the correct initial supply", async function () {
    const totalSupply = await tracto.totalSupply();
    const ownerBalance = await tracto.balanceOf(owner.address);
    expect(totalSupply).to.equal(ethers.parseEther("0.007"));
    expect(ownerBalance).to.equal(totalSupply);
  });

  it("Should allow token transfers", async function () {
    await tracto.transfer(addr1.address, ethers.parseEther("0.001"));
    const addr1Balance = await tracto.balanceOf(addr1.address);
    expect(addr1Balance).to.equal(ethers.parseEther("0.001"));
  });

  it("Should not allow transfers exceeding balance", async function () {
    await expect(
      tracto.connect(addr1).transfer(addr2.address, ethers.parseEther("1"))
    ).to.be.revertedWithoutReason();
  });

  it("Should allow approvals and transferFrom", async function () {
    await tracto.approve(addr1.address, ethers.parseEther("0.0005"));
    const allowance = await tracto.allowance(owner.address, addr1.address);
    expect(allowance).to.equal(ethers.parseEther("0.0005"));

    await tracto
      .connect(addr1)
      .transferFrom(owner.address, addr2.address, ethers.parseEther("0.0005"));
    const addr2Balance = await tracto.balanceOf(addr2.address);
    expect(addr2Balance).to.equal(ethers.parseEther("0.0005"));
  });

  it("Should allow increasing and decreasing approval", async function () {
    await tracto.increaseApproval(addr1.address, ethers.parseEther("30"));
    let allowance = await tracto.allowance(owner.address, addr1.address);
    expect(allowance).to.equal(ethers.parseEther("30"));

    await tracto.decreaseApproval(addr1.address, ethers.parseEther("10"));
    allowance = await tracto.allowance(owner.address, addr1.address);
    expect(allowance).to.equal(ethers.parseEther("20"));
  });

  it("Should allow the owner to change name and symbol", async function () {
    await tracto.changeNameSymbol("NewName", "NEW");
    const name = await tracto.name();
    const symbol = await tracto.symbol();
    expect(name).to.equal("NewName");
    expect(symbol).to.equal("NEW");
  });

  it("Should not allow non-owners to change name and symbol", async function () {
    await expect(
      tracto.connect(addr1).changeNameSymbol("NewName", "NEW")
    ).to.be.revertedWithoutReason();
  });

  it("Should allow the owner to transfer ownership", async function () {
    await tracto.transferOwnership(addr1.address);
    const newOwner = await tracto.owner();
    expect(newOwner).to.equal(addr1.address);
  });

  it("Should not allow non-owners to transfer ownership", async function () {
    await expect(
      tracto.connect(addr1).transferOwnership(addr2.address)
    ).to.be.revertedWithoutReason();
  });
 });
