const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("RemiCoin", function () {
  let RemiCoin, remiCoin, owner, addr1, addr2;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    const initialSupply = ethers.parseEther("1000");
    RemiCoin = await ethers.getContractFactory("contracts/2018-12025-2.sol:RemiCoin");
    remiCoin = await RemiCoin.deploy(initialSupply, "RemiCoin", "RMC", 18);
  });

  it("should assign the initial supply to the owner", async function () {
    const ownerBalance = await remiCoin.balanceOf(owner.address);
    expect(ownerBalance).to.equal(ethers.parseEther("1000"));
  });

  it("should transfer tokens between accounts", async function () {
    await remiCoin.transfer(addr1.address, ethers.parseEther("100"));
    const addr1Balance = await remiCoin.balanceOf(addr1.address);
    expect(addr1Balance).to.equal(ethers.parseEther("100"));
  });

  it("should not allow transfer from frozen accounts", async function () {
    await remiCoin.freezeAccount(owner.address, true);

    const beforeSender = await remiCoin.balanceOf(owner.address);
    const beforeReceiver = await remiCoin.balanceOf(addr1.address);

    // Probeer de transfer
    try {
      await remiCoin.transfer(addr1.address, ethers.parseEther("200"));
    } catch (_) {
      // oude contracts gebruiken throw, dus geen revert catch mogelijk
    }

    const afterSender = await remiCoin.balanceOf(owner.address);
    const afterReceiver = await remiCoin.balanceOf(addr1.address);

    expect(afterSender).to.equal(beforeSender);
    expect(afterReceiver).to.equal(beforeReceiver);
  });


  it("should allow minting of new tokens by the owner", async function () {
    await remiCoin.mintToken(addr1.address, ethers.parseEther("500"));
    const addr1Balance = await remiCoin.balanceOf(addr1.address);
    expect(addr1Balance).to.equal(ethers.parseEther("500"));
  });

  it("should allow changing the token name by the owner", async function () {
    await remiCoin.changeName("NewRemiCoin");
    expect(await remiCoin.name()).to.equal("NewRemiCoin");
  });
});
