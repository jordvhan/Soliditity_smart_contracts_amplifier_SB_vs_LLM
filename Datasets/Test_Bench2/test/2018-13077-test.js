const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CTB Token Contract", function () {
  let owner, addr1, addr2, CTB, ctb;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    const initialSupply = ethers.parseEther("1000");
    CTB = await ethers.getContractFactory("CTB");
    ctb = await CTB.deploy(initialSupply, "CTB Token", 18, "CTB");
  });

  it("Should deploy with correct initial supply", async function () {
    const totalSupply = await ctb.totalSupply();
    expect(totalSupply).to.equal(ethers.parseEther("1000"));
  });

  it("Should transfer tokens between accounts", async function () {
    await ctb.transfer(addr1.address, ethers.parseEther("100"));
    const balance = await ctb.balanceOf(addr1.address);
    expect(balance).to.equal(ethers.parseEther("100"));
  });

  it("Should not transfer tokens if sender has insufficient balance", async function () {
    await expect(
      ctb.connect(addr1).transfer(addr2.address, ethers.parseEther("100"))
    ).to.be.reverted;
  });

  it("Should allow owner to mint tokens", async function () {
    await ctb.mintToken(addr1.address, ethers.parseEther("500"));
    const balance = await ctb.balanceOf(addr1.address);
    expect(balance).to.equal(ethers.parseEther("500"));
  });

  it("Should freeze and unfreeze accounts", async function () {
    await ctb.freezeAccount(addr1.address, true);
    await expect(
      ctb.connect(addr1).transfer(addr2.address, ethers.parseEther("100"))
    ).to.be.reverted;

    await ctb.freezeAccount(addr1.address, false);
    await ctb.transfer(addr1.address, ethers.parseEther("100"));
    const balance = await ctb.balanceOf(addr1.address);
    expect(balance).to.equal(ethers.parseEther("100"));
  });

  it("Should set buy and sell prices", async function () {
    await ctb.setPrices(ethers.parseEther("0.01"), ethers.parseEther("0.02"));
    const sellPrice = await ctb.sellPrice();
    const buyPrice = await ctb.buyPrice();
    expect(sellPrice).to.equal(ethers.parseEther("0.01"));
    expect(buyPrice).to.equal(ethers.parseEther("0.02"));
  });

  it("Should not allow selling tokens if contract lacks sufficient Ether", async function () {
    await ctb.setPrices(ethers.parseEther("0.01"), ethers.parseEther("0.02"));
    await ctb.transfer(addr1.address, ethers.parseEther("100"));
    await expect(ctb.connect(addr1).sell(ethers.parseEther("100"))).to.be.reverted;
  });

  it("Should approve and transfer tokens via transferFrom", async function () {
    await ctb.approve(addr1.address, ethers.parseEther("200"));
    await ctb.connect(addr1).transferFrom(owner.address, addr2.address, ethers.parseEther("100"));
    const balance = await ctb.balanceOf(addr2.address);
    expect(balance).to.equal(ethers.parseEther("100"));
  });

  it("Should burn tokens", async function () {
    const initialSupply = await ctb.totalSupply();
    await ctb.burn(ethers.parseEther("100"));
    const newSupply = await ctb.totalSupply();
    expect(newSupply).to.equal(initialSupply - ethers.parseEther("100"));
  });

  it("Should not allow burning tokens if account lacks sufficient balance", async function () {
    await expect(ctb.connect(addr1).burn(ethers.parseEther("100"))).to.be.reverted;
  });

  it("Should not allow burning tokens from another account if allowance is not sufficient", async function () {
    await ctb.transfer(addr1.address, ethers.parseEther("100"));
    await expect(ctb.connect(addr1).burnFrom(addr1.address, ethers.parseEther("200"))).to.be.reverted;
  });

  it("Should transfer ownership", async function () {
    await ctb.transferOwnership(addr1.address);
    expect(await ctb.owner()).to.equal(addr1.address);
  });

  it("Should not allow buying tokens if buyPrice is zero", async function () {
    await ctb.setPrices(ethers.parseEther("0.01"), ethers.parseEther("0"));
    const amountToSend = ethers.parseEther("1");
    await expect(ctb.connect(addr1).buy({ value: amountToSend })).to.be.reverted;
  });
});
