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

  it("Should allow transfer after account is unfrozen", async function () {
    await myBoToken.freezeAccount(addr1.address, true);
    await myBoToken.freezeAccount(addr1.address, false);
    await myBoToken.transfer(addr1.address, ethers.parseEther("10"));
    expect(await myBoToken.balanceOf(addr1.address)).to.equal(ethers.parseEther("10"));
  });

  it("Should not allow transferFrom when account is frozen", async function () {
    await myBoToken.approve(addr1.address, ethers.parseEther("100"));
    await myBoToken.freezeAccount(owner.address, true);
    await expect(
      myBoToken.connect(addr1).transferFrom(owner.address, addr2.address, ethers.parseEther("10"))
    ).to.be.reverted;
  });

  it("Should allow transferFrom after account is unfrozen", async function () {
    await myBoToken.approve(addr1.address, ethers.parseEther("100"));
    await myBoToken.freezeAccount(owner.address, true);
    await myBoToken.freezeAccount(owner.address, false);
    await myBoToken.connect(addr1).transferFrom(owner.address, addr2.address, ethers.parseEther("10"));
    expect(await myBoToken.balanceOf(addr2.address)).to.equal(ethers.parseEther("10"));
  });

  it("Should handle transfer to self", async function () {
    await myBoToken.transfer(owner.address, ethers.parseEther("10"));
    expect(await myBoToken.balanceOf(owner.address)).to.equal(ethers.parseEther("1000"));
  });

  it("Should handle transfer of zero tokens", async function () {
    await myBoToken.transfer(addr1.address, ethers.parseEther("0"));
    expect(await myBoToken.balanceOf(addr1.address)).to.equal(ethers.parseEther("0"));
  });

  it("Should not allow transfer if balance is insufficient", async function () {
    await expect(
      myBoToken.transfer(addr1.address, ethers.parseEther("2000"))
    ).to.be.reverted;
  });

  it("Should allow approve and transferFrom", async function () {
    await myBoToken.approve(addr1.address, ethers.parseEther("100"));
    await myBoToken.connect(addr1).transferFrom(owner.address, addr2.address, ethers.parseEther("50"));
    expect(await myBoToken.balanceOf(addr2.address)).to.equal(ethers.parseEther("50"));
    expect(await myBoToken.allowance(owner.address, addr1.address)).to.equal(ethers.parseEther("50"));
  });

  it("Should not allow transferFrom if allowance is insufficient", async function () {
    await myBoToken.approve(addr1.address, ethers.parseEther("10"));
    await expect(
      myBoToken.connect(addr1).transferFrom(owner.address, addr2.address, ethers.parseEther("50"))
    ).to.be.reverted;
  });

  it("Should handle approve of zero value", async function () {
    await myBoToken.approve(addr1.address, ethers.parseEther("0"));
    expect(await myBoToken.allowance(owner.address, addr1.address)).to.equal(ethers.parseEther("0"));
  });

  it("Should handle approve to the same spender multiple times", async function () {
    await myBoToken.approve(addr1.address, ethers.parseEther("50"));
    await myBoToken.approve(addr1.address, ethers.parseEther("100"));
    expect(await myBoToken.allowance(owner.address, addr1.address)).to.equal(ethers.parseEther("100"));
  });

  it("Should test fallback function", async function () {
    await expect(
      owner.sendTransaction({
        to: myBoToken.target,
        value: ethers.parseEther("1.0"),
      })
    ).to.be.reverted;
  });

  it("Should not allow sell if balance is insufficient", async function () {
    const tokensToSell = ethers.parseEther("2000");
    await expect(myBoToken.sell(tokensToSell)).to.be.reverted;
  });

  it("Should test burn functionality with zero amount", async function () {
    const initialTotalSupply = await myBoToken.totalSupply();
    await myBoToken.burn(ethers.parseEther("0"));
    const finalTotalSupply = await myBoToken.totalSupply();
    expect(initialTotalSupply).to.equal(finalTotalSupply);
  });

  it("Should not allow burn if balance is insufficient", async function () {
    await expect(myBoToken.burn(ethers.parseEther("2000"))).to.be.reverted;
  });
});
