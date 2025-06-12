const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("GoalToken", function () {
  let GoalToken, goalToken, owner, addr1, addr2;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    const GoalTokenFactory = await ethers.getContractFactory("GoalToken");
    goalToken = await GoalTokenFactory.deploy();
  });

  it("Should set the correct owner", async function () {
    expect(await goalToken.owner()).to.equal(owner.address);
  });

  it("Should mint tokens correctly", async function () {
    await goalToken.mintToken(addr1.address, ethers.parseEther("100"));
    expect(await goalToken.balanceOf(addr1.address)).to.equal(ethers.parseEther("100"));
    expect(await goalToken.totalSupply()).to.equal(ethers.parseEther("100"));
  });

  it("Should transfer tokens correctly", async function () {
    await goalToken.mintToken(owner.address, ethers.parseEther("100"));
    await goalToken.transfer(addr1.address, ethers.parseEther("50"));
    expect(await goalToken.balanceOf(owner.address)).to.equal(ethers.parseEther("50"));
    expect(await goalToken.balanceOf(addr1.address)).to.equal(ethers.parseEther("50"));
  });

  it("Should approve and allow transferFrom correctly", async function () {
    await goalToken.mintToken(owner.address, ethers.parseEther("100"));
    await goalToken.approve(addr1.address, ethers.parseEther("50"));
    expect(await goalToken.allowance(owner.address, addr1.address)).to.equal(ethers.parseEther("50"));

    await goalToken.connect(addr1).transferFrom(owner.address, addr2.address, ethers.parseEther("50"));
    expect(await goalToken.balanceOf(owner.address)).to.equal(ethers.parseEther("50"));
    expect(await goalToken.balanceOf(addr2.address)).to.equal(ethers.parseEther("50"));
  });

  it("Should burn tokens correctly", async function () {
    await goalToken.mintToken(owner.address, ethers.parseEther("100"));
    await goalToken.burn(ethers.parseEther("40"));
    expect(await goalToken.balanceOf(owner.address)).to.equal(ethers.parseEther("60"));
    expect(await goalToken.totalSupply()).to.equal(ethers.parseEther("60"));
  });

  it("Should burn tokens from another account correctly", async function () {
    await goalToken.mintToken(owner.address, ethers.parseEther("100"));
    await goalToken.approve(addr1.address, ethers.parseEther("30"));
    await goalToken.connect(addr1).burnFrom(owner.address, ethers.parseEther("30"));
    expect(await goalToken.balanceOf(owner.address)).to.equal(ethers.parseEther("70"));
    expect(await goalToken.totalSupply()).to.equal(ethers.parseEther("70"));
  });

  it("Should not allow non-owner to mint tokens", async function () {
    await expect(goalToken.connect(addr1).mintToken(addr1.address, ethers.parseEther("100"))).to.be.reverted;
  });

  it("Should change ownership correctly", async function () {
    await goalToken.changeOwner(addr1.address);
    expect(await goalToken.owner()).to.equal(addr1.address);
  });

  it("Should not allow non-owner to change ownership", async function () {
    await expect(goalToken.connect(addr1).changeOwner(addr2.address)).to.be.reverted;
  });

  it("Should emit Transfer event on transfer", async function () {
    await goalToken.mintToken(owner.address, ethers.parseEther("100"));
    await expect(goalToken.transfer(addr1.address, ethers.parseEther("50")))
      .to.emit(goalToken, "Transfer")
      .withArgs(owner.address, addr1.address, ethers.parseEther("50"));
  });

  it("Should emit Burn event on burn", async function () {
    await goalToken.mintToken(owner.address, ethers.parseEther("100"));
    await expect(goalToken.burn(ethers.parseEther("40")))
      .to.emit(goalToken, "Burn")
      .withArgs(owner.address, ethers.parseEther("40"));
  });
});
