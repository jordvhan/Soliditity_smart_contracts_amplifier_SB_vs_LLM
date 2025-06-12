const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("FuturXe", function () {
  let FuturXe, futurXe, owner, addr1, addr2;
  const initialSupply = ethers.parseEther("2000");

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    FuturXe = await ethers.getContractFactory("FuturXe");
    futurXe = await FuturXe.deploy(initialSupply, "FuturXe", "FXE", 18);
  });

  it("should assign the initial supply to the owner", async function () {
    const ownerBalance = await futurXe.balanceOf(owner.address);
    expect(ownerBalance).to.equal(initialSupply);
  });

  it("should transfer tokens between accounts", async function () {
    await futurXe.transfer(addr1.address, ethers.parseEther("200"));
    const addr1Balance = await futurXe.balanceOf(addr1.address);
    expect(addr1Balance).to.equal(ethers.parseEther("200"));
  });

  it("should not allow transfer from frozen accounts", async function () {
    await futurXe.freezeAccount(owner.address, true);

    const beforeSender = await futurXe.balanceOf(owner.address);
    const beforeReceiver = await futurXe.balanceOf(addr1.address);

    try {
      await futurXe.transfer(addr1.address, ethers.parseEther("200"));
    } catch (_) {}

    const afterSender = await futurXe.balanceOf(owner.address);
    const afterReceiver = await futurXe.balanceOf(addr1.address);

    expect(afterSender).to.equal(beforeSender);
    expect(afterReceiver).to.equal(beforeReceiver);
  });

  it("should allow minting of new tokens by the owner", async function () {
    await futurXe.mintToken(addr1.address, ethers.parseEther("1000"));
    const addr1Balance = await futurXe.balanceOf(addr1.address);
    expect(addr1Balance).to.equal(ethers.parseEther("1000"));
  });

  it("should allow changing the token symbol by the owner", async function () {
    await futurXe.changeSymbol("NEWFXE");
    expect(await futurXe.symbol()).to.equal("NEWFXE");
  });

  it("should allow changing the token name by the owner", async function () {
    await futurXe.changeName("NewName");
    expect(await futurXe.name()).to.equal("NewName");
  });

  it("should allow changing the token decimals by the owner", async function () {
    await futurXe.changeDecimals(8);
    expect(await futurXe.decimals()).to.equal(8);
  });

  it("should allow approving an allowance", async function () {
    await futurXe.approve(addr1.address, ethers.parseEther("100"));
    expect(await futurXe.allowance(owner.address, addr1.address)).to.equal(ethers.parseEther("100"));
  });

  it("should handle transfer of zero value", async function () {
    const initialBalanceOwner = await futurXe.balanceOf(owner.address);
    const initialBalanceAddr1 = await futurXe.balanceOf(addr1.address);
    await futurXe.transfer(addr1.address, 0);
    expect(await futurXe.balanceOf(owner.address)).to.equal(initialBalanceOwner);
    expect(await futurXe.balanceOf(addr1.address)).to.equal(initialBalanceAddr1);
  });

  it("should handle transferFrom of zero value", async function () {
    await futurXe.approve(addr1.address, ethers.parseEther("100"));
    const initialBalanceOwner = await futurXe.balanceOf(owner.address);
    const initialBalanceAddr2 = await futurXe.balanceOf(addr2.address);
    await futurXe.connect(addr1).transferFrom(owner.address, addr2.address, 0);
    expect(await futurXe.balanceOf(owner.address)).to.equal(initialBalanceOwner);
    expect(await futurXe.balanceOf(addr2.address)).to.equal(initialBalanceAddr2);
  });

  it("should emit the Approval event on approve", async function () {
    await expect(futurXe.approve(addr1.address, ethers.parseEther("100")))
      .to.emit(futurXe, "Approval")
      .withArgs(owner.address, addr1.address, ethers.parseEther("100"));
  });

  it("should emit the Transfer event on transfer", async function () {
    await expect(futurXe.transfer(addr1.address, ethers.parseEther("100")))
      .to.emit(futurXe, "Transfer")
      .withArgs(owner.address, addr1.address, ethers.parseEther("100"));
  });

  it("should emit the FrozenFunds event on freezeAccount", async function () {
    await expect(futurXe.freezeAccount(addr1.address, true))
      .to.emit(futurXe, "FrozenFunds")
      .withArgs(addr1.address, true);
  });

  it("should not allow minting tokens by non-owner", async function () {
    await expect(futurXe.connect(addr1).mintToken(addr1.address, ethers.parseEther("100"))).to.be.reverted;
  });

  it("should not allow freezing accounts by non-owner", async function () {
    await expect(futurXe.connect(addr1).freezeAccount(addr1.address, true)).to.be.reverted;
  });

  it("should not allow changing name by non-owner", async function () {
    await expect(futurXe.connect(addr1).changeName("NewName")).to.be.reverted;
  });

  it("should not allow changing symbol by non-owner", async function () {
    await expect(futurXe.connect(addr1).changeSymbol("NEWFXE")).to.be.reverted;
  });

  it("should not allow changing decimals by non-owner", async function () {
    await expect(futurXe.connect(addr1).changeDecimals(8)).to.be.reverted;
  });
});
