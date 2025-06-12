const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Greedy Contract", function () {
  let Greedy, greedy, owner, addr1, addr2;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    const Owned = await ethers.getContractFactory("contracts/2018-17877.sol:Owned");
    const owned = await Owned.deploy();
    Greedy = await ethers.getContractFactory("Greedy");
    greedy = await Greedy.deploy();
  });

  it("Should set the correct owner", async function () {
    expect(await greedy.owner()).to.equal(owner.address);
  });

  it("Should transfer ownership", async function () {
    await greedy.transferOwnership(addr1.address);
    await greedy.connect(addr1).acceptOwnership();
    expect(await greedy.owner()).to.equal(addr1.address);
  });

  it("Should revert if non-owner tries to transfer ownership", async function () {
    await expect(
      greedy.connect(addr1).transferOwnership(addr2.address)
    ).to.be.revertedWithoutReason();
  });

  it("Should allow buying hearts", async function () {
    const heartPrice = await greedy.getHeartPrice();
    await greedy.connect(addr1).buyHeart(addr2.address, {
      value: ethers.parseEther("1"),
    });
    expect(await greedy.RoundMyHeart(1, addr1.address)).to.be.gt(0);
  });

  it("Should update the timer when hearts are bought", async function () {
    const initialTime = await greedy.RoundTime(1);
    await greedy.connect(addr1).buyHeart(addr2.address, {
      value: ethers.parseEther("1"),
    });
    const updatedTime = await greedy.RoundTime(1);
    expect(updatedTime).to.be.gt(initialTime);
  });

  it("Should distribute referral rewards", async function () {
    await greedy.connect(addr1).buyHeart(addr2.address, {
      value: ethers.parseEther("1"),
    });
    expect(await greedy.MyreferredRevenue(addr2.address)).to.be.gt(0);
  });

  it("Should allow the winner to claim the pot", async function () {
    await greedy.connect(addr1).buyHeart(addr2.address, {
      value: ethers.parseEther("1"),
    });
    await ethers.provider.send("evm_increaseTime", [600]); // Simulate time passing
    await ethers.provider.send("evm_mine");
    const initialBalance = await ethers.provider.getBalance(addr1.address);
    await greedy.connect(addr1).win();
    const finalBalance = await ethers.provider.getBalance(addr1.address);
    expect(finalBalance).to.be.gt(initialBalance);
  });

  it("Should allow withdrawal of earnings", async function () {
    await greedy.connect(addr1).buyHeart(addr2.address, {
      value: ethers.parseEther("1"),
    });
    const initialBalance = await ethers.provider.getBalance(addr1.address);
    await greedy.connect(addr1).withdraw(1);
    const finalBalance = await ethers.provider.getBalance(addr1.address);
    expect(finalBalance).to.be.gt(initialBalance);
  });

  it("Should allow the owner to withdraw fees", async function () {
    await greedy.connect(addr1).buyHeart(addr2.address, {
      value: ethers.parseEther("1"),
    });
    const initialBalance = await ethers.provider.getBalance(owner.address);
    await greedy.withdrawOwner();
    const finalBalance = await ethers.provider.getBalance(owner.address);
    expect(finalBalance).to.be.gt(initialBalance);
  });

  it("Should revert if non-owner tries to withdraw fees", async function () {
    await expect(greedy.connect(addr1).withdrawOwner()).to.be.revertedWithoutReason()
  });

  it("Should return correct time left", async function () {
    await greedy.connect(addr1).buyHeart(addr2.address, {
      value: ethers.parseEther("1"),
    });
    const timeLeft = await greedy.getTimeLeft();
    expect(timeLeft).to.be.gt(0);
  });

  it("Should handle lucky buy correctly", async function () {
    await greedy.connect(addr1).buyHeart(addr2.address, {
      value: ethers.parseEther("0.1"),
    });
    const luckyBuyTracker = await greedy.luckybuyTracker_();
    expect(luckyBuyTracker).to.be.gt(0);
  });
});
