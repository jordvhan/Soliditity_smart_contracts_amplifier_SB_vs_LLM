const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Tiles Contract", function () {
  let Tiles, tiles, owner, addr1, addr2;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    Tiles = await ethers.getContractFactory("Tiles");
    tiles = await Tiles.deploy({ value: ethers.parseEther("1") });
  });

  it("Should deploy with the correct initial values", async function () {
    expect(await tiles.runner.address).to.equal(owner.address);
    expect(await tiles.currentGameNumber()).to.equal(1);
    expect(await tiles.currentGameCost()).to.equal(ethers.parseEther("0.005"));
    expect(await tiles.numTilesClaimed()).to.equal(0);
    expect(await tiles.gameStopped()).to.equal(false);
  });

  it("Should allow claiming a tile", async function () {
    await tiles.connect(addr1).claimTile(0, 0, 1, { value: ethers.parseEther("0.005") });
    const tile = await tiles.tiles(0, 0);
    expect(tile.claimedBy).to.equal(addr1.address);
    expect(tile.gameClaimed).to.equal(1);
    expect(await tiles.numTilesClaimed()).to.equal(1);
  });

  it("Should revert if claiming a tile with incorrect game number", async function () {
    await expect(
      tiles.connect(addr1).claimTile(0, 0, 2, { value: ethers.parseEther("0.005") })
    ).to.be.reverted;
  });

  it("Should revert if claiming a tile with incorrect payment", async function () {
    await expect(
      tiles.connect(addr1).claimTile(0, 0, 1, { value: ethers.parseEther("0.001") })
    ).to.be.reverted;
  });

  it("Should allow the owner to update game cost", async function () {
    await tiles.connect(owner).updateGameCost(ethers.parseEther("0.01"));
    expect(await tiles.nextGameCost()).to.equal(ethers.parseEther("0.01"));
    expect(await tiles.willChangeCost()).to.equal(true);
  });

  it("Should allow claiming winnings", async function () {
    await tiles.connect(addr1).claimTile(0, 0, 1, { value: ethers.parseEther("0.005") });
    await tiles.connect(addr1).claimTile(0, 1, 1, { value: ethers.parseEther("0.005") });
    // Simulate game end
    for (let i = 0; i < 16; i++) {
      for (let j = 0; j < 16; j++) {
        if (i === 0 && j < 2) continue; // Skip already claimed tiles
        await tiles.connect(addr2).claimTile(i, j, 1, { value: ethers.parseEther("0.005") });
      }
    }
    await tiles.connect(addr1).claimWinnings();
    expect(await tiles.pendingWithdrawals(addr1.address)).to.equal(0);
  });

  it("Should allow the owner to claim earnings", async function () {
    await tiles.connect(addr1).claimTile(0, 0, 1, { value: ethers.parseEther("0.005") });
    await tiles.connect(owner).claimOwnersEarnings();
    expect(await tiles.gameEarnings()).to.equal(0);
  });

  it("Should allow the owner to stop the game", async function () {
    await tiles.connect(owner).cancelContract();
    expect(await tiles.gameStopped()).to.equal(true);
  });

  it("Should revert if non-owner tries to stop the game", async function () {
    await expect(tiles.connect(addr1).cancelContract()).to.be.reverted;
  });
});
