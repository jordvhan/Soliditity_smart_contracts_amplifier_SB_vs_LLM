const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MyBoToken Contract", function () {
  let MyBoToken, myBoToken, owner, addr1, addr2;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    const initialSupply = ethers.parseEther("1000");
    MyBoToken = await ethers.getContractFactory("MyBoToken");
    myBoToken = await MyBoToken.deploy(initialSupply, "MyBoToken", 18, "MBT");
  });

  it("Should deploy with correct initial supply", async function () {
    const totalSupply = await myBoToken.totalSupply();
    expect(totalSupply).to.equal(ethers.parseEther("1000"));
    const ownerBalance = await myBoToken.balanceOf(owner.address);
    expect(ownerBalance).to.equal(ethers.parseEther("1000"));
  });

  it("Should transfer ownership", async function () {
    await myBoToken.transferOwnership(addr1.address);
    expect(await myBoToken.owner()).to.equal(addr1.address);
  });

  it("Should transfer tokens", async function () {
    await myBoToken.transfer(addr1.address, ethers.parseEther("100"));
    const addr1Balance = await myBoToken.balanceOf(addr1.address);
    expect(addr1Balance).to.equal(ethers.parseEther("100"));
  });

  it("Should mint tokens", async function () {
    await myBoToken.mintToken(addr1.address, ethers.parseEther("500"));
    const addr1Balance = await myBoToken.balanceOf(addr1.address);
    expect(addr1Balance).to.equal(ethers.parseEther("500"));
    const totalSupply = await myBoToken.totalSupply();
    expect(totalSupply).to.equal(ethers.parseEther("1500"));
  });

  it("Should freeze and unfreeze accounts", async function () {
    await myBoToken.freezeAccount(addr1.address, true);
    expect(await myBoToken.frozenAccount(addr1.address)).to.be.true;

    await expect(
      myBoToken.connect(addr1).transfer(addr2.address, ethers.parseEther("10"))
    ).to.be.reverted;

    await myBoToken.freezeAccount(addr1.address, false);
    expect(await myBoToken.frozenAccount(addr1.address)).to.be.false;
  });

  it("Should set buy and sell prices", async function () {
    await myBoToken.setPrices(ethers.parseEther("0.01"), ethers.parseEther("0.02"));
    expect(await myBoToken.sellPrice()).to.equal(ethers.parseEther("0.01"));
    expect(await myBoToken.buyPrice()).to.equal(ethers.parseEther("0.02"));
  });

  it("Should burn tokens", async function () {
    await myBoToken.burn(ethers.parseEther("100"));
    const totalSupply = await myBoToken.totalSupply();
    expect(totalSupply).to.equal(ethers.parseEther("900"));
  });
});
