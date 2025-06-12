const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("FuturXe", function () {
  let FuturXe, futurXe, owner, addr1, addr2;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    const initialSupply = ethers.parseEther("2000");
    FuturXe = await ethers.getContractFactory("FuturXe");
    futurXe = await FuturXe.deploy(initialSupply, "FuturXe", "FXE", 18);
  });

  it("should assign the initial supply to the owner", async function () {
    const ownerBalance = await futurXe.balanceOf(owner.address);
    expect(ownerBalance).to.equal(ethers.parseEther("2000"));
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

    // Probeer de transfer
    try {
      await futurXe.transfer(addr1.address, ethers.parseEther("200"));
    } catch (_) {
      // oude contracts gebruiken throw, dus geen revert catch mogelijk
    }

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
});
