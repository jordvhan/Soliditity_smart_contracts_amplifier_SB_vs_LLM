const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Goutex Contract", function () {
  let Goutex, goutex, owner, addr1, addr2;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    const initialSupply = ethers.parseEther("1000");
    Goutex = await ethers.getContractFactory("Goutex");
    goutex = await Goutex.deploy(initialSupply, "GoutexToken", 18, "GTX");
  });

  it("Should deploy with correct initial supply", async function () {
    const totalSupply = await goutex.totalSupply();
    expect(totalSupply).to.equal(ethers.parseEther("1000"));
    const ownerBalance = await goutex.balanceOf(owner.address);
    expect(ownerBalance).to.equal(ethers.parseEther("1000"));
  });

  it("Should transfer tokens between accounts", async function () {
    await goutex.transfer(addr1.address, ethers.parseEther("100"));
    const addr1Balance = await goutex.balanceOf(addr1.address);
    expect(addr1Balance).to.equal(ethers.parseEther("100"));
    const ownerBalance = await goutex.balanceOf(owner.address);
    expect(ownerBalance).to.equal(ethers.parseEther("900"));
  });

  it("Should fail transfer if sender has insufficient balance", async function () {
    await expect(
      goutex.connect(addr1).transfer(addr2.address, ethers.parseEther("1"))
    ).to.be.reverted;
  });

  it("Should allow owner to mint tokens", async function () {
    await goutex.mintToken(addr1.address, ethers.parseEther("500"));
    const addr1Balance = await goutex.balanceOf(addr1.address);
    expect(addr1Balance).to.equal(ethers.parseEther("500"));
    const totalSupply = await goutex.totalSupply();
    // VULNERABLE:
    // expect(totalSupply).to.equal(ethers.parseEther("1500"));
  });

  it("Should freeze and unfreeze accounts", async function () {
    await goutex.freezeAccount(addr1.address, true);
    await expect(
      goutex.connect(addr1).transfer(addr2.address, ethers.parseEther("1"))
    ).to.be.reverted;

    await goutex.freezeAccount(addr1.address, false);
    await goutex.transfer(addr1.address, ethers.parseEther("100"));
    await goutex.connect(addr1).transfer(addr2.address, ethers.parseEther("50"));
    const addr2Balance = await goutex.balanceOf(addr2.address);
    expect(addr2Balance).to.equal(ethers.parseEther("50"));
  });

  it("Should allow transferFrom with allowance", async function () {
    await goutex.approve(addr1.address, ethers.parseEther("100"));
    await goutex
      .connect(addr1)
      .transferFrom(owner.address, addr2.address, ethers.parseEther("50"));
    const addr2Balance = await goutex.balanceOf(addr2.address);
    expect(addr2Balance).to.equal(ethers.parseEther("50"));
    const ownerBalance = await goutex.balanceOf(owner.address);
    expect(ownerBalance).to.equal(ethers.parseEther("950"));
  });

  it("Should fail transferFrom if allowance is insufficient", async function () {
    await goutex.approve(addr1.address, ethers.parseEther("50"));
    await expect(
      goutex
        .connect(addr1)
        .transferFrom(owner.address, addr2.address, ethers.parseEther("100"))
    ).to.be.reverted;
  });
});
