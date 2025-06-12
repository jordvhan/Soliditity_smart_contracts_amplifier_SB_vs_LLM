const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ExtremeToken Contract", function () {
  let owner, addr1, addr2, ExtremeToken, extremeToken;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    const ExtremeTokenFactory = await ethers.getContractFactory("ExtremeToken");
    extremeToken = await ExtremeTokenFactory.deploy();
  });

  it("Should deploy with the correct initial supply", async function () {
    const totalSupply = await extremeToken.totalSupply();
    expect(totalSupply).to.equal(59347950076);
    const ownerBalance = await extremeToken.balanceOf(owner.address);
    expect(ownerBalance).to.equal(59347950076);
  });

  it("Should allow the owner to set buy and sell prices", async function () {
    await extremeToken.setPrices(ethers.parseEther("0.01"), ethers.parseEther("0.02"));
    const sellPrice = await extremeToken.sellPrice();
    const buyPrice = await extremeToken.buyPrice();
    expect(sellPrice).to.equal(ethers.parseEther("0.01"));
    expect(buyPrice).to.equal(ethers.parseEther("0.02"));
  });

  it("Should revert if user tries to sell more tokens than they have", async function () {
    await expect(extremeToken.connect(addr1).sell(10)).to.be.reverted;
  });

  it("Should allow token transfers between users", async function () {
    await extremeToken.transfer(addr1.address, 100);
    await extremeToken.connect(addr1).transfer(addr2.address, 50);
    const addr1Balance = await extremeToken.balanceOf(addr1.address);
    const addr2Balance = await extremeToken.balanceOf(addr2.address);
    expect(addr1Balance).to.equal(50);
    expect(addr2Balance).to.equal(50);
  });

  it("Should revert if transfer amount exceeds balance", async function () {
    await expect(extremeToken.connect(addr1).transfer(addr2.address, 10)).to.be.reverted;
  });

  it("Should allow the owner to mint new tokens", async function () {
    await extremeToken.mintToken(addr1.address, 1000);
    const addr1Balance = await extremeToken.balanceOf(addr1.address);
    const totalSupply = await extremeToken.totalSupply();
    expect(addr1Balance).to.equal(1000);
    expect(totalSupply).to.equal(59347951076); // 59347950076 + 1000
  });

  it("Should revert if non-owner tries to mint tokens", async function () {
    await expect(extremeToken.connect(addr1).mintToken(addr1.address, 1000)).to.be.reverted;
  });
});
