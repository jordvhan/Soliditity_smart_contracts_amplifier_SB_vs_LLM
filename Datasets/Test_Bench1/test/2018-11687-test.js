const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("BitcoinRed Contract", function () {
  let BitcoinRed, bitcoinRed, owner, addr1, addr2, addrs;

  beforeEach(async function () {
    BitcoinRed = await ethers.getContractFactory("BitcoinRed");
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();
    bitcoinRed = await BitcoinRed.deploy();
  });

  it("Should set the correct owner", async function () {
    expect(await bitcoinRed.owner()).to.equal(owner.address);
  });

  it("Should assign the total supply of tokens to the owner", async function () {
    const ownerBalance = await bitcoinRed.balanceOf(owner.address);
    expect(ownerBalance).to.equal(ethers.parseEther("0.0021"));
  });

  it("Should distribute tokens to multiple addresses", async function () {
    const recipients = [addr1.address, addr2.address];
    await bitcoinRed.distributeBTR(recipients);

    expect(await bitcoinRed.balanceOf(addr1.address)).to.equal(ethers.parseEther("0.0000002"));
    expect(await bitcoinRed.balanceOf(addr2.address)).to.equal(ethers.parseEther("0.0000002"));
    const ownerBalance = await bitcoinRed.balanceOf(owner.address);
    expect(ownerBalance).to.equal(ethers.parseEther("0.0020996"));
  });

  it("Should transfer tokens between accounts", async function () {
    await bitcoinRed.transfer(addr1.address, ethers.parseEther("0.0000001"));
    expect(await bitcoinRed.balanceOf(addr1.address)).to.equal(ethers.parseEther("0.0000001"));

    await bitcoinRed.connect(addr1).transfer(addr2.address, ethers.parseEther("0.00000005"));
    expect(await bitcoinRed.balanceOf(addr2.address)).to.equal(ethers.parseEther("0.00000005"));
    expect(await bitcoinRed.balanceOf(addr1.address)).to.equal(ethers.parseEther("0.00000005"));
  });

  it("Should approve and handle allowances correctly", async function () {
    await bitcoinRed.approve(addr1.address, ethers.parseEther("0.0000001"));
    expect(await bitcoinRed.allowance(owner.address, addr1.address)).to.equal(ethers.parseEther("0.0000001"));

    await bitcoinRed.connect(addr1).transferFrom(owner.address, addr2.address, ethers.parseEther("0.00000005"));
    expect(await bitcoinRed.balanceOf(addr2.address)).to.equal(ethers.parseEther("0.00000005"));
    expect(await bitcoinRed.allowance(owner.address, addr1.address)).to.equal(ethers.parseEther("0.00000005"));
  });

  it("Should not transfer if sender doesn’t have enough tokens", async function () {
    const beforeSender = await bitcoinRed.balanceOf(addr1.address);
    const beforeReceiver = await bitcoinRed.balanceOf(addr2.address);

    await bitcoinRed.connect(addr1).transfer(addr2.address, ethers.parseEther("0.0000000001"));

    const afterSender = await bitcoinRed.balanceOf(addr1.address);
    const afterReceiver = await bitcoinRed.balanceOf(addr2.address);

    expect(afterSender).to.equal(beforeSender);
    expect(afterReceiver).to.equal(beforeReceiver);
  });

  it("Should not transferFrom more than allowed", async function () {
    await bitcoinRed.approve(addr1.address, ethers.parseEther("100"));

    const beforeFrom = await bitcoinRed.balanceOf(owner.address);
    const beforeTo = await bitcoinRed.balanceOf(addr2.address);

    await bitcoinRed.connect(addr1).transferFrom(owner.address, addr2.address, ethers.parseEther("200"));

    const afterFrom = await bitcoinRed.balanceOf(owner.address);
    const afterTo = await bitcoinRed.balanceOf(addr2.address);

    expect(afterFrom).to.equal(beforeFrom);
    expect(afterTo).to.equal(beforeTo);
  });
});
