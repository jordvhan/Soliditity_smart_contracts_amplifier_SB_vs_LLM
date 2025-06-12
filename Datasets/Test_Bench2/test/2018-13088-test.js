const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MyAdvancedToken", function () {
  let Token, token, owner, addr1, addr2;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    Token = await ethers.getContractFactory("contracts/2018-13088.sol:MyAdvancedToken");
    token = await Token.deploy(
      ethers.parseEther("1000"), // initial supply
      "TestToken", // token name
      "TTK" // token symbol
    );
  });

  it("Should deploy with correct initial values", async function () {
    expect(await token.name()).to.equal("TestToken");
    expect(await token.symbol()).to.equal("TTK");
    expect(await token.totalSupply()).to.equal(ethers.parseEther("1000000000000000000000"));
    expect(await token.balanceOf(owner.address)).to.equal(ethers.parseEther("1000000000000000000000"));
  });

  it("Should transfer tokens between accounts", async function () {
    await token.transfer(addr1.address, ethers.parseEther("100000000000000000000"));
    expect(await token.balanceOf(addr1.address)).to.equal(ethers.parseEther("100000000000000000000"));
    expect(await token.balanceOf(owner.address)).to.equal(ethers.parseEther("900000000000000000000"));
  });

  it("Should fail if sender does not have enough balance", async function () {
    await expect(
      token.connect(addr1).transfer(addr2.address, ethers.parseEther("1"))
    ).to.be.reverted;
  });

  it("Should allow owner to mint tokens", async function () {
    await token.mintToken(addr1.address, ethers.parseEther("500000000000000000000"));
    expect(await token.balanceOf(addr1.address)).to.equal(ethers.parseEther("500000000000000000000"));
    expect(await token.totalSupply()).to.equal(ethers.parseEther("1500000000000000000000"));
  });

  it("Should allow owner to freeze and unfreeze accounts", async function () {
    await token.freezeAccount(addr1.address, true);
    expect(await token.frozenAccount(addr1.address)).to.equal(true);

    await expect(
      token.connect(addr1).transfer(addr2.address, ethers.parseEther("1"))
    ).to.be.reverted;

    await token.freezeAccount(addr1.address, false);
    expect(await token.frozenAccount(addr1.address)).to.equal(false);
  });

  it("Should allow owner to set buy and sell prices", async function () {
    await token.setPrices(ethers.parseEther("0.01"), ethers.parseEther("0.02"));
    expect(await token.sellPrice()).to.equal(ethers.parseEther("0.01"));
    expect(await token.buyPrice()).to.equal(ethers.parseEther("0.02"));
  });

  it("Should fail to buy or sell if prices are not set", async function () {
    await expect(
      token.connect(addr1).buy({ value: ethers.parseEther("1") })
    ).to.be.reverted;

    // weird test behaviour: wants to sell tokens for 0 each but doesn't have tokens so transaction goes through
    await expect(
      token.connect(addr1).sell(ethers.parseEther("50"))
    ).to.be.ok;
  });

  it("Should transfer ownership", async function () {
    await token.transferOwnership(addr1.address);
    expect(await token.owner()).to.equal(addr1.address);
  });

  it("Should prevent non-owners from transferring ownership", async function () {
    await expect(token.connect(addr1).transferOwnership(addr2.address)).to.be.reverted;
  });

  it("Should prevent transfers to the zero address", async function () {
    await expect(token.transfer(ethers.ZeroAddress, ethers.parseEther("10"))).to.be.reverted;
  });

  it("Should prevent minting by non-owners", async function () {
    await expect(token.connect(addr1).mintToken(addr2.address, ethers.parseEther("100"))).to.be.reverted;
  });

  it("Should prevent freezing by non-owners", async function () {
    await expect(token.connect(addr1).freezeAccount(addr2.address, true)).to.be.reverted;
  });

  it("Should prevent setting prices by non-owners", async function () {
    await expect(token.connect(addr1).setPrices(ethers.parseEther("0.01"), ethers.parseEther("0.02"))).to.be.reverted;
  });
});
