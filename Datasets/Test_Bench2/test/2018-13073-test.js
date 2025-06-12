const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ETHEREUMBLACK Contract", function () {
  let owner, addr1, addr2, contract;
  const initialSupply = ethers.parseEther("200000000");

  beforeEach(async function () {
    const ETHEREUMBLACK = await ethers.getContractFactory("ETHEREUMBLACK");
    [owner, addr1, addr2] = await ethers.getSigners();
    contract = await ETHEREUMBLACK.deploy();
  });

  it("Should deploy with the correct initial supply", async function () {
    expect(await contract.totalSupply()).to.equal(initialSupply);
    expect(await contract.balanceOf(owner.address)).to.equal(initialSupply);
  });

  it("Should transfer tokens between accounts", async function () {
    const transferAmount = ethers.parseEther("100");
    await contract.transfer(addr1.address, transferAmount);
    expect(await contract.balanceOf(addr1.address)).to.equal(transferAmount);
    expect(await contract.balanceOf(owner.address)).to.equal(
      initialSupply - transferAmount
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
      initialSupply + mintAmount
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

  it("Should prevent transfer if account is frozen", async function () {
    await contract.freezeAccount(owner.address, true);
    await expect(contract.transfer(addr1.address, ethers.parseEther("10"))).to.be.reverted;
    await contract.freezeAccount(owner.address, false);
  });

  it("Should handle transfer of zero value", async function () {
    await contract.transfer(addr1.address, 0);
    expect(await contract.balanceOf(addr1.address)).to.equal(0);
  });

  it("Should handle transferFrom of zero value", async function () {
    await contract.approve(addr1.address, 0);
    await contract
      .connect(addr1)
      .transferFrom(owner.address, addr2.address, 0);
    expect(await contract.balanceOf(addr2.address)).to.equal(0);
  });

  it("Should prevent minting tokens by non-owner", async function () {
    await expect(
      contract.connect(addr1).mintToken(addr1.address, ethers.parseEther("100"))
    ).to.be.reverted;
  });

  it("Should prevent freezing accounts by non-owner", async function () {
    await expect(
      contract.connect(addr1).freezeAccount(addr1.address, true)
    ).to.be.reverted;
  });

  it("Should handle transferFrom when the sender and receiver are the same", async function () {
    await contract.approve(addr1.address, ethers.parseEther("100"));
    await contract
      .connect(addr1)
      .transferFrom(owner.address, owner.address, ethers.parseEther("50"));
    expect(await contract.balanceOf(owner.address)).to.equal(initialSupply);
  });

  it("Should prevent transferFrom from a frozen account, even with allowance", async function () {
    await contract.freezeAccount(owner.address, true);
    await contract.approve(addr1.address, ethers.parseEther("100"));
    await expect(
      contract
        .connect(addr1)
        .transferFrom(owner.address, addr2.address, ethers.parseEther("10"))
    ).to.be.reverted;
  });

  it("Should handle transfer to self", async function () {
    const initialBalance = await contract.balanceOf(owner.address);
    await contract.transfer(owner.address, ethers.parseEther("0"));
    expect(await contract.balanceOf(owner.address)).to.equal(initialBalance);
  });

  it("Should handle transferFrom to self", async function () {
    await contract.approve(addr1.address, ethers.parseEther("100"));
    const initialBalance = await contract.balanceOf(owner.address);
    await contract
      .connect(addr1)
      .transferFrom(owner.address, owner.address, ethers.parseEther("0"));
    expect(await contract.balanceOf(owner.address)).to.equal(initialBalance);
  });

  it("Should handle multiple transfers", async function () {
    await contract.transfer(addr1.address, ethers.parseEther("100"));
    await contract.transfer(addr2.address, ethers.parseEther("200"));
    expect(await contract.balanceOf(addr1.address)).to.equal(
      ethers.parseEther("100")
    );
    expect(await contract.balanceOf(addr2.address)).to.equal(
      ethers.parseEther("200")
    );
    expect(await contract.balanceOf(owner.address)).to.equal(
      initialSupply - ethers.parseEther("300")
    );
  });

  it("Should handle multiple transferFrom calls", async function () {
    await contract.approve(addr1.address, ethers.parseEther("300"));
    await contract
      .connect(addr1)
      .transferFrom(owner.address, addr2.address, ethers.parseEther("100"));
    await contract
      .connect(addr1)
      .transferFrom(owner.address, addr2.address, ethers.parseEther("200"));
    expect(await contract.balanceOf(addr2.address)).to.equal(
      ethers.parseEther("300")
    );
    expect(await contract.balanceOf(owner.address)).to.equal(
      initialSupply - ethers.parseEther("300")
    );
  });

  it("Should handle transfer after account is unfrozen", async function () {
    await contract.freezeAccount(addr1.address, true);
    await contract.freezeAccount(addr1.address, false);
    await contract.transfer(addr1.address, ethers.parseEther("100"));
    expect(await contract.balanceOf(addr1.address)).to.equal(
      ethers.parseEther("100")
    );
  });

  it("Should handle transferFrom after account is unfrozen", async function () {
    await contract.approve(addr1.address, ethers.parseEther("100"));
    await contract.freezeAccount(owner.address, true);
    await contract.freezeAccount(owner.address, false);
    await contract
      .connect(addr1)
      .transferFrom(owner.address, addr2.address, ethers.parseEther("50"));
    expect(await contract.balanceOf(addr2.address)).to.equal(
      ethers.parseEther("50")
    );
  });

  it("Should handle setting zero prices", async function () {
    await contract.setPrices(0, 0);
    expect(await contract.buyPrice()).to.equal(0);
    expect(await contract.sellPrice()).to.equal(0);
  });

  it("Should prevent selling tokens with insufficient balance", async function () {
    const sellAmount = ethers.parseEther("10");
    await expect(contract.connect(addr1).sell(sellAmount)).to.be.reverted;
  });

  it("Should prevent setting prices by non-owner", async function () {
    const buyPrice = ethers.parseEther("0.01");
    const sellPrice = ethers.parseEther("0.005");
    await expect(
      contract.connect(addr1).setPrices(sellPrice, buyPrice)
    ).to.be.reverted;
  });

  it("Should handle approving an address multiple times", async function () {
    await contract.approve(addr1.address, ethers.parseEther("50"));
    await contract.approve(addr1.address, ethers.parseEther("100"));
    expect(await contract.allowance(owner.address, addr1.address)).to.equal(
      ethers.parseEther("100")
    );
  });

  it("Should handle transfers to multiple accounts", async function () {
    await contract.transfer(addr1.address, ethers.parseEther("100"));
    await contract.transfer(addr2.address, ethers.parseEther("200"));
    expect(await contract.balanceOf(addr1.address)).to.equal(
      ethers.parseEther("100")
    );
    expect(await contract.balanceOf(addr2.address)).to.equal(
      ethers.parseEther("200")
    );
    expect(await contract.balanceOf(owner.address)).to.equal(
      initialSupply - ethers.parseEther("300")
    );
  });
});