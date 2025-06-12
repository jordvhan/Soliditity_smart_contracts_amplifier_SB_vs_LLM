const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("EncryptedToken", function () {
  let owner, addr1, addr2, EncryptedToken, token;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    const Token = await ethers.getContractFactory("contracts/2018-13070.sol:EncryptedToken");
    token = await Token.deploy();
  });

  it("should set the correct owner", async function () {
    expect(await token.owner()).to.equal(owner.address);
  });

  it("should transfer ownership", async function () {
    await token.transferOwnership(addr1.address);
    expect(await token.owner()).to.equal(addr1.address);
  });

  it("should mint tokens", async function () {
    const mintAmount = 1000n;
    await token.mintToken(addr1.address, mintAmount);
    expect(await token.balanceOf(addr1.address)).to.equal(mintAmount);
    expect(await token.totalSupply()).to.equal(ethers.parseEther("100000000", 0)+mintAmount);
  });

  it("should freeze and unfreeze accounts", async function () {
    await token.freezeAccount(addr1.address, true);
    expect(await token.frozenAccount(addr1.address)).to.be.true;

    await token.freezeAccount(addr1.address, false);
    expect(await token.frozenAccount(addr1.address)).to.be.false;
  });

  it("should transfer tokens", async function () {
    const transferAmount = 100;
    await token.transfer(addr1.address, transferAmount);
    expect(await token.balanceOf(addr1.address)).to.equal(transferAmount);
  });

  it("should not transfer tokens from frozen accounts", async function () {
    const transferAmount = 100;
    await token.freezeAccount(owner.address, true);
    await expect(token.transfer(addr1.address, transferAmount)).to.be.reverted;
  });

  it("should approve and transfer tokens via allowance", async function () {
    const approveAmount = 200;
    const transferAmount = 100;

    await token.approve(addr1.address, approveAmount);
    expect(await token.allowance(owner.address, addr1.address)).to.equal(approveAmount);

    await token.connect(addr1).transferFrom(owner.address, addr2.address, transferAmount);
    expect(await token.balanceOf(addr2.address)).to.equal(transferAmount);
    expect(await token.allowance(owner.address, addr1.address)).to.equal(approveAmount - transferAmount);
  });

  it("should burn tokens", async function () {
    const burnAmount = 100n;
    const initialSupply = await token.totalSupply();

    await token.burn(burnAmount);
    expect(await token.totalSupply()).to.equal(initialSupply-burnAmount);
    expect(await token.balanceOf(owner.address)).to.equal(initialSupply-burnAmount);
  });

  it("should burn tokens from another account", async function () {
    const burnAmount = 100;

    // Transfer tokens from deployer (owner) to addr1
    await token.transfer(addr1.address, burnAmount);

    // addr1 approves addr2 to burn tokens on their behalf
    await token.connect(addr1).approve(addr2.address, burnAmount);

    // addr2 burns tokens from addr1's balance
    await token.connect(addr2).burnFrom(addr1.address, burnAmount);

    // Check if the tokens are indeed burned
    expect(await token.balanceOf(addr1.address)).to.equal(0);
  });


  it("should set buy price", async function () {
    const newBuyPrice = 2;
    await token.setPrices(newBuyPrice);
    expect(await token.buyPrice()).to.equal(newBuyPrice);
  });
});
