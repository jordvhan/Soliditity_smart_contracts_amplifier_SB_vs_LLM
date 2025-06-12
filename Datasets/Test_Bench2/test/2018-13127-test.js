const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("DSPXToken", function () {
  let DSPXToken, dspxToken, owner, preSale, team, addr1, addr2;

  beforeEach(async function () {
    [owner, preSale, team, addr1, addr2] = await ethers.getSigners();
    const DSPXTokenFactory = await ethers.getContractFactory("contracts/2018-13127.sol:DSPXToken");
    dspxToken = await DSPXTokenFactory.deploy(preSale.address, team.address);
  });

  it("should deploy with correct initial values", async function () {
    expect(await dspxToken.name()).to.equal("SP8DE PreSale Token");
    expect(await dspxToken.symbol()).to.equal("DSPX");
    expect(await dspxToken.decimals()).to.equal(18);
    expect(await dspxToken.preSale()).to.equal(preSale.address);
    expect(await dspxToken.team()).to.equal(team.address);
    expect(await dspxToken.isFrozen()).to.equal(true);
  });

  it("should allow preSale to mint tokens", async function () {
    const mintAmount = ethers.parseEther("100");
    await dspxToken.connect(preSale).mint(addr1.address, mintAmount);
    expect(await dspxToken.balanceOf(addr1.address)).to.equal(mintAmount);
    expect(await dspxToken.totalSupply()).to.equal(mintAmount);
  });

  it("should not allow non-preSale to mint tokens", async function () {
    const mintAmount = ethers.parseEther("100");
    await expect(dspxToken.connect(addr1).mint(addr1.address, mintAmount)).to.be.reverted;
  });

  it("should not allow minting beyond TOKEN_LIMIT", async function () {
    const tokenLimit = await dspxToken.TOKEN_LIMIT();
    await dspxToken.connect(preSale).mint(addr1.address, tokenLimit);
    await expect(dspxToken.connect(preSale).mint(addr1.address, 1)).to.be.reverted;
  });

  it("should allow team to unfreeze the contract", async function () {
    await dspxToken.connect(team).unfreeze();
    expect(await dspxToken.isFrozen()).to.equal(false);
  });

  it("should not allow non-team to unfreeze the contract", async function () {
    await expect(dspxToken.connect(addr1).unfreeze()).to.be.reverted;
  });

  it("should not allow transfers when frozen", async function () {
    const mintAmount = ethers.parseEther("100");
    await dspxToken.connect(preSale).mint(addr1.address, mintAmount);
    await expect(dspxToken.connect(addr1).transfer(addr2.address, mintAmount)).to.be.reverted;
  });

  it("should allow transfers when unfrozen", async function () {
    const mintAmount = ethers.parseEther("100");
    await dspxToken.connect(preSale).mint(addr1.address, mintAmount);
    await dspxToken.connect(team).unfreeze();
    await dspxToken.connect(addr1).transfer(addr2.address, mintAmount);
    expect(await dspxToken.balanceOf(addr2.address)).to.equal(mintAmount);
  });

  it("should handle transferFrom correctly", async function () {
    const mintAmount = ethers.parseEther("100");
    const transferAmount = ethers.parseEther("50");
    await dspxToken.connect(preSale).mint(addr1.address, mintAmount);
    await dspxToken.connect(team).unfreeze();
    await dspxToken.connect(addr1).approve(addr2.address, transferAmount);
    await dspxToken.connect(addr2).transferFrom(addr1.address, addr2.address, transferAmount);
    expect(await dspxToken.balanceOf(addr2.address)).to.equal(transferAmount);
    expect(await dspxToken.balanceOf(addr1.address)).to.equal(mintAmount-transferAmount);
  });

  it("should handle approve and allowance correctly", async function () {
    const approveAmount = ethers.parseEther("100");
    await dspxToken.connect(team).unfreeze();
    await dspxToken.connect(addr1).approve(addr2.address, approveAmount);
    expect(await dspxToken.allowance(addr1.address, addr2.address)).to.equal(approveAmount);
  });

  it("should handle increaseApproval and decreaseApproval correctly", async function () {
    const initialApproval = ethers.parseEther("100");
    const increaseAmount = ethers.parseEther("50");
    const decreaseAmount = ethers.parseEther("30");
    await dspxToken.connect(team).unfreeze();
    await dspxToken.connect(addr1).approve(addr2.address, initialApproval);
    await dspxToken.connect(addr1).increaseApproval(addr2.address, increaseAmount);
    expect(await dspxToken.allowance(addr1.address, addr2.address)).to.equal(initialApproval+increaseAmount);
    await dspxToken.connect(addr1).decreaseApproval(addr2.address, decreaseAmount);
    expect(await dspxToken.allowance(addr1.address, addr2.address)).to.equal(initialApproval+increaseAmount-decreaseAmount);
  });

  it("should not allow minting zero tokens", async function () {
    await expect(dspxToken.connect(preSale).mint(addr1.address, 0)).to.be.reverted;
  });

  it("should not allow transferFrom with insufficient allowance", async function () {
    const mintAmount = ethers.parseEther("100");
    const transferAmount = ethers.parseEther("150");
    await dspxToken.connect(preSale).mint(addr1.address, mintAmount);
    await dspxToken.connect(team).unfreeze();
    await dspxToken.connect(addr1).approve(addr2.address, mintAmount);
    await expect(dspxToken.connect(addr2).transferFrom(addr1.address, addr2.address, transferAmount)).to.be.reverted;
  });

  it("should not allow decreaseApproval below zero", async function () {
    const initialApproval = ethers.parseEther("100");
    const decreaseAmount = ethers.parseEther("150");
    await dspxToken.connect(team).unfreeze();
    await dspxToken.connect(addr1).approve(addr2.address, initialApproval);
    await dspxToken.connect(addr1).decreaseApproval(addr2.address, decreaseAmount);
    expect(await dspxToken.allowance(addr1.address, addr2.address)).to.equal(0);
  });

  it("should emit Approval event on increaseApproval", async function () {
    const initialApproval = ethers.parseEther("100");
    const increaseAmount = ethers.parseEther("50");
    await dspxToken.connect(team).unfreeze();
    await dspxToken.connect(addr1).approve(addr2.address, initialApproval);

    await expect(dspxToken.connect(addr1).increaseApproval(addr2.address, increaseAmount))
      .to.emit(dspxToken, "Approval")
      .withArgs(addr1.address, addr2.address, initialApproval + increaseAmount);
  });

  it("should emit Approval event on decreaseApproval", async function () {
    const initialApproval = ethers.parseEther("100");
    const decreaseAmount = ethers.parseEther("50");
    await dspxToken.connect(team).unfreeze();
    await dspxToken.connect(addr1).approve(addr2.address, initialApproval);

    await expect(dspxToken.connect(addr1).decreaseApproval(addr2.address, decreaseAmount))
      .to.emit(dspxToken, "Approval")
      .withArgs(addr1.address, addr2.address, initialApproval - decreaseAmount);
  });
});
