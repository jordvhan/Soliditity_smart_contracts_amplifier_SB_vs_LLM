const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Goutex Contract", function () {
  let Goutex, goutex, owner, addr1, addr2, addr3;
  const initialSupply = ethers.parseEther("1000");

  beforeEach(async function () {
    [owner, addr1, addr2, addr3] = await ethers.getSigners();
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

  it("Should handle transfer of zero value", async function () {
    await goutex.transfer(addr1.address, 0);
    expect(await goutex.balanceOf(addr1.address)).to.equal(0);
  });

  it("Should handle transferFrom of zero value", async function () {
    await goutex.approve(addr1.address, 0);
    await goutex
      .connect(addr1)
      .transferFrom(owner.address, addr2.address, 0);
    expect(await goutex.balanceOf(addr2.address)).to.equal(0);
  });

  it("Should prevent minting tokens by non-owner", async function () {
    await expect(
      goutex.connect(addr1).mintToken(addr1.address, ethers.parseEther("100"))
    ).to.be.reverted;
  });

  it("Should prevent freezing accounts by non-owner", async function () {
    await expect(
      goutex.connect(addr1).freezeAccount(addr1.address, true)
    ).to.be.reverted;
  });

  it("Should emit FrozenFunds event when freezing an account", async function () {
    await expect(goutex.freezeAccount(addr1.address, true))
      .to.emit(goutex, "FrozenFunds")
      .withArgs(addr1.address, true);
  });

  it("Should emit FrozenFunds event when unfreezing an account", async function () {
    await goutex.freezeAccount(addr1.address, true);
    await expect(goutex.freezeAccount(addr1.address, false))
      .to.emit(goutex, "FrozenFunds")
      .withArgs(addr1.address, false);
  });

  it("Should handle transferFrom when the sender and receiver are the same", async function () {
    await goutex.approve(addr1.address, ethers.parseEther("100"));
    await goutex
      .connect(addr1)
      .transferFrom(owner.address, owner.address, ethers.parseEther("50"));
    expect(await goutex.balanceOf(owner.address)).to.equal(initialSupply);
  });

  it("Should prevent transferFrom from a frozen account, even with allowance", async function () {
    await goutex.freezeAccount(owner.address, true);
    await goutex.approve(addr1.address, ethers.parseEther("100"));
    await expect(
      goutex
        .connect(addr1)
        .transferFrom(owner.address, addr2.address, ethers.parseEther("10"))
    ).to.be.reverted;
  });

  it("Should handle transfer to self", async function () {
    const initialBalance = await goutex.balanceOf(owner.address);
    await goutex.transfer(owner.address, ethers.parseEther("0"));
    expect(await goutex.balanceOf(owner.address)).to.equal(initialBalance);
  });

  it("Should handle transferFrom to self", async function () {
    await goutex.approve(addr1.address, ethers.parseEther("100"));
    const initialBalance = await goutex.balanceOf(owner.address);
    await goutex
      .connect(addr1)
      .transferFrom(owner.address, owner.address, ethers.parseEther("0"));
    expect(await goutex.balanceOf(owner.address)).to.equal(initialBalance);
  });

  it("Should handle multiple transfers", async function () {
    await goutex.transfer(addr1.address, ethers.parseEther("100"));
    await goutex.transfer(addr2.address, ethers.parseEther("200"));
    expect(await goutex.balanceOf(addr1.address)).to.equal(
      ethers.parseEther("100")
    );
    expect(await goutex.balanceOf(addr2.address)).to.equal(
      ethers.parseEther("200")
    );
    expect(await goutex.balanceOf(owner.address)).to.equal(
      ethers.parseEther("700")
    );
  });

  it("Should handle multiple transferFrom calls", async function () {
    await goutex.approve(addr1.address, ethers.parseEther("300"));
    await goutex
      .connect(addr1)
      .transferFrom(owner.address, addr2.address, ethers.parseEther("100"));
    await goutex
      .connect(addr1)
      .transferFrom(owner.address, addr2.address, ethers.parseEther("200"));
    expect(await goutex.balanceOf(addr2.address)).to.equal(
      ethers.parseEther("300")
    );
    expect(await goutex.balanceOf(owner.address)).to.equal(
      ethers.parseEther("700")
    );
  });

  it("Should handle transfer after account is unfrozen", async function () {
    await goutex.freezeAccount(addr1.address, true);
    await goutex.freezeAccount(addr1.address, false);
    await goutex.transfer(addr1.address, ethers.parseEther("100"));
    expect(await goutex.balanceOf(addr1.address)).to.equal(
      ethers.parseEther("100")
    );
  });

  it("Should handle transferFrom after account is unfrozen", async function () {
    await goutex.approve(addr1.address, ethers.parseEther("100"));
    await goutex.freezeAccount(owner.address, true);
    await goutex.freezeAccount(owner.address, false);
    await goutex
      .connect(addr1)
      .transferFrom(owner.address, addr2.address, ethers.parseEther("50"));
    expect(await goutex.balanceOf(addr2.address)).to.equal(
      ethers.parseEther("50")
    );
  });

  it("Should allow owner to mint tokens", async function () {
    const mintAmount = ethers.parseEther("200");
    await goutex.mintToken(owner.address, mintAmount);
    expect(await goutex.balanceOf(owner.address)).to.equal(
      ethers.parseEther("1200")
    );
  });

  it("Should handle transferFrom with exact allowance", async function () {
    const transferAmount = ethers.parseEther("100");
    await goutex.approve(addr1.address, transferAmount);
    await goutex
      .connect(addr1)
      .transferFrom(owner.address, addr2.address, transferAmount);
    expect(await goutex.balanceOf(addr2.address)).to.equal(transferAmount);
  });

  it("Should handle multiple approvals for different accounts", async function () {
    await goutex.approve(addr1.address, ethers.parseEther("100"));
    await goutex.approve(addr2.address, ethers.parseEther("200"));
    expect(await goutex.allowance(owner.address, addr1.address)).to.equal(
      ethers.parseEther("100")
    );
    expect(await goutex.allowance(owner.address, addr2.address)).to.equal(
      ethers.parseEther("200")
    );
  });

  it("Should handle transfers to multiple accounts", async function () {
    await goutex.transfer(addr1.address, ethers.parseEther("100"));
    await goutex.transfer(addr2.address, ethers.parseEther("200"));
    await goutex.transfer(addr3.address, ethers.parseEther("300"));
    expect(await goutex.balanceOf(addr1.address)).to.equal(
      ethers.parseEther("100")
    );
    expect(await goutex.balanceOf(addr2.address)).to.equal(
      ethers.parseEther("200")
    );
    expect(await goutex.balanceOf(addr3.address)).to.equal(
      ethers.parseEther("300")
    );
  });

  it("Should handle transferFrom to self with different allowances", async function () {
    await goutex.approve(addr1.address, ethers.parseEther("100"));
    await goutex.approve(addr2.address, ethers.parseEther("200"));
    await goutex
      .connect(addr1)
      .transferFrom(owner.address, owner.address, ethers.parseEther("50"));
    expect(await goutex.balanceOf(owner.address)).to.equal(initialSupply);
    await goutex
      .connect(addr2)
      .transferFrom(owner.address, owner.address, ethers.parseEther("50"));
    expect(await goutex.balanceOf(owner.address)).to.equal(initialSupply);
  });

  it("Should handle transferFrom after freezing and unfreezing", async function () {
    await goutex.approve(addr1.address, ethers.parseEther("100"));
    await goutex.freezeAccount(owner.address, true);
    await expect(
      goutex
        .connect(addr1)
        .transferFrom(owner.address, addr2.address, ethers.parseEther("10"))
    ).to.be.reverted;
    await goutex.freezeAccount(owner.address, false);
    await goutex
      .connect(addr1)
      .transferFrom(owner.address, addr2.address, ethers.parseEther("10"));
    expect(await goutex.balanceOf(addr2.address)).to.equal(
      ethers.parseEther("10")
    );
  });
});
