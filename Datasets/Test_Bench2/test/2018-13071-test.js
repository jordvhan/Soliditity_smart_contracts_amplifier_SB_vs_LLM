const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CCindexToken", function () {
  let CCindexToken, token, owner, addr1, addr2, addr3;

  beforeEach(async function () {
    [owner, addr1, addr2, addr3] = await ethers.getSigners();
    const Token = await ethers.getContractFactory("CCindexToken");
    token = await Token.deploy();
  });

  it("Should deploy with correct initial supply", async function () {
    const totalSupply = await token.totalSupply();
    expect(totalSupply).to.equal(ethers.parseEther("40000000"));
  });

  it("Should allow transfers between accounts", async function () {
    await token.transfer(addr1.address, ethers.parseEther("100"));
    expect(await token.balanceOf(addr1.address)).to.equal(ethers.parseEther("100"));
  });

  it("Should not allow transfers from frozen accounts", async function () {
    await token.freezeAccount(addr1.address, true);
    await expect(token.connect(addr1).transfer(addr2.address, ethers.parseEther("10"))).to.be.reverted;
  });

  it("Should allow approvals and transferFrom", async function () {
    await token.approve(addr1.address, ethers.parseEther("50"));
    await token.connect(addr1).transferFrom(owner.address, addr2.address, ethers.parseEther("50"));
    expect(await token.balanceOf(addr2.address)).to.equal(ethers.parseEther("50"));
  });

  it("Should allow minting of new tokens", async function () {
    await token.mintToken(addr1.address, ethers.parseEther("100"));
    expect(await token.balanceOf(addr1.address)).to.equal(ethers.parseEther("100"));
  });

  it("Should allow freezing and unfreezing of accounts", async function () {
    await token.freezeAccount(addr1.address, true);
    expect(await token.frozenAccount(addr1.address)).to.equal(true);
    await token.freezeAccount(addr1.address, false);
    expect(await token.frozenAccount(addr1.address)).to.equal(false);
  });

  it("Should distribute tokens correctly", async function () {
    await token.transfer(addr1.address, ethers.parseEther("100"));
    await token.transfer(addr2.address, ethers.parseEther("200"));

    await token.distributeTokens(0, 2);

    const balance1 = await token.balanceOf(addr1.address);
    const balance2 = await token.balanceOf(addr2.address);

    expect(balance1).to.equal(ethers.parseEther("103")); // +3%
    expect(balance2).to.equal(ethers.parseEther("206")); // +3%

    const distributed = balance1 + balance2 - ethers.parseEther("300"); // 3% of total

    expect(distributed).to.equal(ethers.parseEther("9"));
  });

  it("Should return all token holders", async function () {
    await token.transfer(addr1.address, ethers.parseEther("100"));
    await token.transfer(addr2.address, ethers.parseEther("200"));
    const holders = await token.getAddresses();
    expect(holders).to.include(addr1.address);
    expect(holders).to.include(addr2.address);
  });

  it("Should handle transfer of zero value", async function () {
    await token.transfer(addr1.address, ethers.parseEther("0"));
    expect(await token.balanceOf(addr1.address)).to.equal(ethers.parseEther("0"));
  });

  it("Should not allow transfer when balance is insufficient", async function () {
    await expect(token.connect(addr1).transfer(addr2.address, ethers.parseEther("10"))).to.be.reverted;
  });

  it("Should not allow transferFrom when allowance is insufficient", async function () {
    await token.approve(addr1.address, ethers.parseEther("10"));
    await expect(token.connect(addr1).transferFrom(owner.address, addr2.address, ethers.parseEther("50"))).to.be.reverted;
  });

  it("Should allow setting of prices", async function () {
    await token.setPrices(1, 2);
    const sellPrice = await token.sellPrice();
    const buyPrice = await token.buyPrice();
    expect(sellPrice).to.equal(1);
    expect(buyPrice).to.equal(2);
  });

  it("Should not allow distribution with invalid range", async function () {
    await expect(token.distributeTokens(1, 0)).to.be.reverted;
  });

  it("Should handle transfer to self", async function () {
    await token.transfer(owner.address, ethers.parseEther("10"));
    expect(await token.balanceOf(owner.address)).to.be.above(ethers.parseEther("39999999"));
  });

  it("Should handle minting zero tokens", async function () {
    await token.mintToken(addr1.address, 0);
    expect(await token.balanceOf(addr1.address)).to.equal(ethers.parseEther("0"));
  });

  it("Should handle freezing and unfreezing the same account multiple times", async function () {
    await token.freezeAccount(addr1.address, true);
    await token.freezeAccount(addr1.address, true);
    expect(await token.frozenAccount(addr1.address)).to.equal(true);
    await token.freezeAccount(addr1.address, false);
    await token.freezeAccount(addr1.address, false);
    expect(await token.frozenAccount(addr1.address)).to.equal(false);
  });

  it("Should handle transferFrom with sufficient allowance", async function () {
    await token.approve(addr1.address, ethers.parseEther("100"));
    await token.connect(addr1).transferFrom(owner.address, addr2.address, ethers.parseEther("50"));
    expect(await token.balanceOf(addr2.address)).to.equal(ethers.parseEther("50"));
  });

  it("Should handle selling tokens when buyer doesn't have enough ether", async function () {
    await token.transfer(addr1.address, ethers.parseEther("1"));
    await token.setPrices(ethers.parseEther("1000000000000000000"), 1); // sellPrice of 1 ether
    await expect(token.connect(addr1).sell(ethers.parseEther("1"))).to.be.reverted;
  });

  it("Should handle distribution when startIndex is greater than lastIndex", async function () {
    await expect(token.distributeTokens(2, 1)).to.be.reverted;
  });

  it("Should handle transfer of max value", async function () {
    const initialBalance = await token.balanceOf(owner.address);
    const transferValue = initialBalance;
    await token.transfer(addr1.address, transferValue);
    expect(await token.balanceOf(addr1.address)).to.equal(transferValue);
  });

  it("Should handle transferFrom of max value", async function () {
    const initialBalance = await token.balanceOf(owner.address);
    const transferValue = initialBalance;
    await token.approve(addr1.address, transferValue);
    await token.connect(addr1).transferFrom(owner.address, addr2.address, transferValue);
    expect(await token.balanceOf(addr2.address)).to.equal(transferValue);
  });

  it("Should handle setting zero prices", async function () {
    await token.setPrices(0, 0);
    expect(await token.sellPrice()).to.equal(0);
    expect(await token.buyPrice()).to.equal(0);
  });

  it("Should handle buying zero tokens", async function () {
    await token.setPrices(1, 1);
    await token.buy({ value: 0 });
    expect(await token.balanceOf(owner.address)).to.be.above(ethers.parseEther("39999999"));
  });

  it("Should handle selling zero tokens", async function () {
    await token.transfer(addr1.address, ethers.parseEther("1"));
    const initialBalance = await token.balanceOf(addr1.address);
    await token.setPrices(1, 1);
    await token.connect(addr1).sell(0);
    expect(await token.balanceOf(addr1.address)).to.equal(initialBalance);
  });
});
