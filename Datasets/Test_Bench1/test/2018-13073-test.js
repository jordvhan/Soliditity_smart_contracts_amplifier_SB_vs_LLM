const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ETHEREUMBLACK Contract", function () {
  let owner, addr1, addr2, contract;

  beforeEach(async function () {
    const ETHEREUMBLACK = await ethers.getContractFactory("ETHEREUMBLACK");
    [owner, addr1, addr2] = await ethers.getSigners();
    contract = await ETHEREUMBLACK.deploy();
  });

  it("Should deploy with the correct initial supply", async function () {
    const initialSupply = ethers.parseEther("200000000");
    expect(await contract.totalSupply()).to.equal(initialSupply);
    expect(await contract.balanceOf(owner.address)).to.equal(initialSupply);
  });

  it("Should transfer tokens between accounts", async function () {
    const transferAmount = ethers.parseEther("100");
    await contract.transfer(addr1.address, transferAmount);
    expect(await contract.balanceOf(addr1.address)).to.equal(transferAmount);
    expect(await contract.balanceOf(owner.address)).to.equal(
      ethers.parseEther("200000000")-transferAmount
    );
  });

  it("Should not allow transfer if sender has insufficient balance", async function () {
    const transferAmount = ethers.parseEther("100");
    await expect(
      contract.connect(addr1).transfer(addr2.address, transferAmount)
    ).to.be.reverted;
  });

  it("Should approve and allow transferFrom", async function () {
    const approveAmount = ethers.parseEther("50");
    await contract.approve(addr1.address, approveAmount);
    expect(await contract.allowance(owner.address, addr1.address)).to.equal(
      approveAmount
    );

    await contract
      .connect(addr1)
      .transferFrom(owner.address, addr2.address, approveAmount);
    expect(await contract.balanceOf(addr2.address)).to.equal(approveAmount);
  });

  it("Should mint new tokens", async function () {
    const mintAmount = ethers.parseEther("1000");
    await contract.mintToken(addr1.address, mintAmount);
    expect(await contract.totalSupply()).to.equal(
      ethers.parseEther("200000000")+mintAmount
    );
    expect(await contract.balanceOf(addr1.address)).to.equal(mintAmount);
  });

  it("Should freeze and unfreeze accounts", async function () {
    await contract.freezeAccount(addr1.address, true);
    expect(await contract.frozenAccount(addr1.address)).to.be.true;

    await expect(
      contract.connect(addr1).transfer(addr2.address, ethers.parseEther("10"))
    ).to.be.reverted;

    await contract.freezeAccount(addr1.address, false);
    expect(await contract.frozenAccount(addr1.address)).to.be.false;
  });

  it("Should set buy and sell prices", async function () {
    const buyPrice = ethers.parseEther("0.01");
    const sellPrice = ethers.parseEther("0.005");
    await contract.setPrices(sellPrice, buyPrice);
    expect(await contract.buyPrice()).to.equal(buyPrice);
    expect(await contract.sellPrice()).to.equal(sellPrice);
  });
});
