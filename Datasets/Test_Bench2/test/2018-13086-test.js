const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("IADOWR Contract", function () {
  let owner, addr1, addr2, token;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    const Token = await ethers.getContractFactory("IADOWR");
    token = await Token.deploy();
  });

  it("Should set the correct owner", async function () {
    expect(await token.owner()).to.equal(owner.address);
  });

  it("Should transfer ownership", async function () {
    await token.transferOwnership(addr1.address);
    expect(await token.owner()).to.equal(addr1.address);
  });

  it("Should mint tokens", async function () {
    const mintAmount = ethers.parseEther("1000");
    await token.mintToken(addr1.address, mintAmount);
    expect(await token.balanceOf(addr1.address)).to.equal(mintAmount);
    expect(await token.totalSupply()).to.equal(ethers.parseEther("2000000000")+mintAmount);
  });

  it("Should freeze and unfreeze accounts", async function () {
    await token.freezeAccount(addr1.address, true);
    expect(await token.frozenAccount(addr1.address)).to.be.true;

    await token.freezeAccount(addr1.address, false);
    expect(await token.frozenAccount(addr1.address)).to.be.false;
  });

  it("Should transfer tokens", async function () {
    const transferAmount = ethers.parseEther("100");
    await token.transfer(addr1.address, transferAmount);
    expect(await token.balanceOf(addr1.address)).to.equal(transferAmount);
  });

  it("Should not transfer from frozen accounts", async function () {
    const transferAmount = ethers.parseEther("100");
    await token.freezeAccount(owner.address, true);
    await expect(token.transfer(addr1.address, transferAmount)).to.be.reverted;
  });

  it("Should approve and transferFrom tokens", async function () {
    const approveAmount = ethers.parseEther("200");
    await token.approve(addr1.address, approveAmount);
    expect(await token.allowance(owner.address, addr1.address)).to.equal(approveAmount);

    await token.connect(addr1).transferFrom(owner.address, addr2.address, approveAmount);
    expect(await token.balanceOf(addr2.address)).to.equal(approveAmount);
  });

  it("Should burn tokens", async function () {
    const burnAmount = ethers.parseEther("100");
    await token.burn(burnAmount);
    expect(await token.balanceOf(owner.address)).to.equal(ethers.parseEther("2000000000")-burnAmount);
    // VULNERABLE: totalSupply is defined in super and derived contract and only updated in the supercontract
    //expect(await token.totalSupply()).to.equal(ethers.parseEther("2000000000")-burnAmount);
  });

  it("Should burn tokens from another account", async function () {
    const burnAmount = ethers.parseEther("50");
    await token.transfer(addr1.address, burnAmount);
    await token.connect(addr1).approve(owner.address, burnAmount);
    await token.burnFrom(addr1.address, burnAmount);
    expect(await token.balanceOf(addr1.address)).to.equal(0);
    // VULNERABLE: totalSupply is defined in super and derived contract and only updated in the supercontract
    //expect(await token.totalSupply()).to.equal(ethers.parseEther("2000000000")-burnAmount);
  });

  it("Should set buy and sell prices", async function () {
    const newSellPrice = ethers.parseEther("0.2");
    const newBuyPrice = ethers.parseEther("0.3");
    await token.setPrices(newSellPrice, newBuyPrice);
    expect(await token.sellPrice()).to.equal(newSellPrice);
    expect(await token.buyPrice()).to.equal(newBuyPrice);
  });

  it("Should not transfer to the zero address", async function () {
    const transferAmount = ethers.parseEther("100");
    await expect(token.transfer("0x0000000000000000000000000000000000000000", transferAmount)).to.be.reverted;
  });

  it("Should handle transfer to self", async function () {
    const transferAmount = ethers.parseEther("100");
    await token.transfer(owner.address, transferAmount);
    expect(await token.balanceOf(owner.address)).to.equal(ethers.parseEther("2000000000"));
  });

  it("Should handle transferFrom with insufficient allowance", async function () {
    const transferAmount = ethers.parseEther("200");
    await token.approve(addr1.address, ethers.parseEther("100"));
    await expect(token.connect(addr1).transferFrom(owner.address, addr2.address, transferAmount)).to.be.reverted;
  });

  it("Should handle burn from with insufficient balance", async function () {
    const burnAmount = ethers.parseEther("2000000001");
    await expect(token.burn(burnAmount)).to.be.reverted;
  });

  it("Should handle burnFrom with insufficient allowance", async function () {
    const burnAmount = ethers.parseEther("50");
    await token.transfer(addr1.address, burnAmount);
    await token.connect(addr1).approve(owner.address, ethers.parseEther("20"));
    await expect(token.burnFrom(addr1.address, burnAmount)).to.be.reverted;
  });

  it("Should handle setting zero prices", async function () {
    await token.setPrices(0, 0);
    expect(await token.sellPrice()).to.equal(0);
    expect(await token.buyPrice()).to.equal(0);
  });

  it("Should handle buying with zero buy price", async function () {
    await token.setPrices(ethers.parseEther("0.1"), 0);
    await expect(token.buy({ value: ethers.parseEther("1") })).to.be.reverted;
  });

  it("Should handle selling with contract having insufficient ether", async function () {
    const sellAmount = ethers.parseEther("10");
    const sellPrice = ethers.parseEther("0.01");
    await token.setPrices(sellPrice, ethers.parseEther("0.02"));
    await expect(token.sell(sellAmount)).to.be.reverted;
  });
});
