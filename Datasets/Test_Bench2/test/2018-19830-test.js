const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("BAFCToken", function () {
  let owner, addr1, addr2, token;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    const Token = await ethers.getContractFactory("BAFCToken");
    token = await Token.deploy();

    await token.UBSexToken();
  });

  it("Should deploy with correct initial values", async function () {
    expect(await token.name()).to.equal("Business Alliance Financial Circle");
    expect(await token.symbol()).to.equal("BAFC");
    expect(await token.decimals()).to.equal(18);
    expect(await token.totalSupply()).to.equal(ethers.parseEther("190000000"));
    expect(await token.balanceOf(owner.address)).to.equal(ethers.parseEther("190000000"));
  });

  it("Should transfer ownership", async function () {
    await token.transferOwnership(addr1.address);
    expect(await token.owner()).to.equal(addr1.address);

    // Transfer ownership back to the original owner for subsequent tests
    await token.connect(addr1).transferOwnership(owner.address);
    expect(await token.owner()).to.equal(owner.address);
  });

  it("Should freeze and unfreeze accounts", async function () {
    await token.freezeAccount(addr1.address, true);
    expect(await token.accountFrozenStatus(addr1.address)).to.be.true;

    await token.freezeAccount(addr1.address, false);
    expect(await token.accountFrozenStatus(addr1.address)).to.be.false;
  });

  it("Should allow the owner to freeze and unfreeze accounts", async function () {
    await token.freezeAccount(addr1.address, true);
    expect(await token.accountFrozenStatus(addr1.address)).to.be.true;

    await token.freezeAccount(addr1.address, false);
    expect(await token.accountFrozenStatus(addr1.address)).to.be.false;
  });

  it("Should switch liquidity", async function () {
    await token.switchLiquidity(false);
    expect(await token.liquidityStatus()).to.be.false;

    await token.switchLiquidity(true);
    expect(await token.liquidityStatus()).to.be.true;

    // Switch liquidity back to true for subsequent tests
    await token.switchLiquidity(false);
    await token.switchLiquidity(true);
  });

  it("Should allow the owner to switch liquidity", async function () {
    await token.switchLiquidity(false);
    expect(await token.liquidityStatus()).to.be.false;

    await token.switchLiquidity(true);
    expect(await token.liquidityStatus()).to.be.true;
  });

  it("Should transfer tokens between accounts", async function () {
    const initialOwnerBalance = await token.balanceOf(owner.address);
    const transferAmount = ethers.parseEther("100");
    await token.transfer(addr1.address, transferAmount);
    expect(await token.balanceOf(addr1.address)).to.equal(ethers.parseEther("100"));
    expect(await token.balanceOf(owner.address)).to.equal(initialOwnerBalance - transferAmount);

    // Transfer tokens back to the owner for subsequent tests
    await token.connect(addr1).transfer(owner.address, transferAmount);
  });

  it("Should not transfer tokens if account is frozen", async function () {
    // Freeze the account of addr1
    await token.freezeAccount(addr1.address, true);

    // Expect the transfer to emit an InvalidAccount event for the frozen recipient
    await expect(token.transfer(addr1.address, ethers.parseEther("100")))
      .to.emit(token, 'InvalidAccount') // Expect InvalidAccount event

    // Unfreeze the account for subsequent tests
    await token.freezeAccount(addr1.address, false);
  });

  it("Should approve and allow transferFrom", async function () {
    const initialOwnerBalance = await token.balanceOf(owner.address);
    const initialAddr2Balance = await token.balanceOf(addr2.address);
    const approveAmount = ethers.parseEther("50");
    await token.approve(addr1.address, approveAmount);
    expect(await token.allowance(owner.address, addr1.address)).to.equal(approveAmount);

    await token.connect(addr1).transferFrom(owner.address, addr2.address, approveAmount);
    expect(await token.balanceOf(addr2.address)).to.equal(initialAddr2Balance + approveAmount);
    expect(await token.balanceOf(owner.address)).to.equal(initialOwnerBalance - approveAmount);

    // Transfer tokens back to the owner for subsequent tests
    await token.connect(addr2).transfer(owner.address, approveAmount);
  });

  it("Should not allow transferFrom if account is frozen", async function () {
    await token.approve(addr1.address, ethers.parseEther("50"));
    await token.freezeAccount(owner.address, true);
    await expect(token.connect(addr1).transferFrom(owner.address, addr2.address, ethers.parseEther("50"))).to.be.reverted;

    // Unfreeze the account for subsequent tests
    await token.freezeAccount(owner.address, false);
  });
});
