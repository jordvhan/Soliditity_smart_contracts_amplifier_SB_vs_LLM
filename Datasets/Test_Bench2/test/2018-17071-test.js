const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("lucky9io Contract", function () {
  let lucky9io, owner, addr1, addr2;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    const Lucky9io = await ethers.getContractFactory("lucky9io");
    lucky9io = await Lucky9io.deploy();
  });

  it("Should deploy the contract and set the owner correctly", async function () {
    expect(await lucky9io.runner.address).to.equal(owner.address);
  });

  it("Should revert if non-owner tries to stop the game", async function () {
    await expect(lucky9io.connect(addr1).stopGame()).to.be.revertedWith("Sender not authorized.");
  });

  it("Should handle multiple game rules correctly", async function () {
    // Test entry_number % 9 == 0, then % 99 == 0, then % 999 == 0

    //entry_number % 9 == 0
    for (let i = 1; i < 9; i++) {
      await addr2.sendTransaction({
        to: await lucky9io.getAddress(),
        value: ethers.parseEther("0.01"),
      });
    }

    await addr1.sendTransaction({
      to: await lucky9io.getAddress(),
      value: ethers.parseEther("0.01"),
    });

    //entry_number % 99 == 0
    for (let i = 1; i < 90; i++) {
      await addr2.sendTransaction({
        to: await lucky9io.getAddress(),
        value: ethers.parseEther("0.01"),
      });
    }

    await addr1.sendTransaction({
      to: await lucky9io.getAddress(),
      value: ethers.parseEther("0.01"),
    });

    //entry_number % 999 == 0
    for (let i = 1; i < 900; i++) {
      await addr2.sendTransaction({
        to: await lucky9io.getAddress(),
        value: ethers.parseEther("0.01"),
      });
    }

    await addr1.sendTransaction({
      to: await lucky9io.getAddress(),
      value: ethers.parseEther("0.01"),
    });
  });
});
