const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CERB_Coin", function () {
  let CERB_Coin, cerbCoin, owner, addr1, addr2;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    const CERB_CoinFactory = await ethers.getContractFactory("CERB_Coin");
    cerbCoin = await CERB_CoinFactory.deploy();
  });

  it("should initialize with correct values", async function () {
    expect(await cerbCoin.name()).to.equal("CERB Coin");
    expect(await cerbCoin.symbol()).to.equal("CERB");
    expect(await cerbCoin.decimals()).to.equal(18);
    expect(await cerbCoin.totalSupply()).to.equal(ethers.parseEther("1000000000"));
    expect(await cerbCoin.balanceOf(owner.address)).to.equal(ethers.parseEther("1000000000"));
  });

  it("should allow the owner to set the ETH rate", async function () {
    await cerbCoin.setEthRate(700);
    expect(await cerbCoin.getEthRate()).to.equal(700);
  });

  it("should allow the owner to set the token price", async function () {
    await cerbCoin.setTokenPrice(100);
    expect(await cerbCoin.getTokenPrice()).to.equal(100);
  });

  it("should allow the owner to change ICO status", async function () {
    await cerbCoin.changeIcoStatus(0);
    expect(await cerbCoin.icoStatus()).to.equal(0);
  });

  it("should allow the owner to mint tokens", async function () {
    await cerbCoin.mintToken(1000);
    expect(await cerbCoin.totalSupply()).to.equal(ethers.parseEther("1000001000"));
    expect(await cerbCoin.balanceOf(owner.address)).to.equal(ethers.parseEther("1000001000"));
  });

  it("should allow the owner to transfer ownership", async function () {
    await cerbCoin.transferOwnership(addr1.address);
    expect(await cerbCoin.balanceOf(owner.address)).to.equal(0);
    expect(await cerbCoin.balanceOf(addr1.address)).to.equal(ethers.parseEther("1000000000"));
    expect(await cerbCoin.owner()).to.equal(addr1.address);
  });

  it("should allow token transfers when enabled", async function () {
    await cerbCoin.setTransferStatus(1);
    await cerbCoin.transfer(addr1.address, ethers.parseEther("100"));
    expect(await cerbCoin.balanceOf(owner.address)).to.equal(ethers.parseEther("999999900"));
    expect(await cerbCoin.balanceOf(addr1.address)).to.equal(ethers.parseEther("100"));
  });

    it("should prevent token transfers when disabled if sender is not owner", async function () {
    await cerbCoin.setTransferStatus(0);
    await expect(cerbCoin.connect(addr2).transfer(addr1.address, ethers.parseEther("100"))).to.be.reverted;
  });

  it("should allow token transfers when disabled if sender is owner", async function () {
    await cerbCoin.setTransferStatus(0);
    await expect(cerbCoin.transfer(addr1.address, ethers.parseEther("100"))).to.be.ok;
  });

  it("should allow the owner to freeze accounts", async function () {
    await cerbCoin.freezeAccount(addr1.address, true);
    await cerbCoin.setTransferStatus(1);
    await expect(cerbCoin.connect(addr1).transfer(addr2.address, ethers.parseEther("10"))).to.be.reverted;
  });

  it("should allow the owner to burn tokens", async function () {
    await cerbCoin.burn(ethers.parseEther("100"));
    expect(await cerbCoin.totalSupply()).to.equal(ethers.parseEther("999999900"));
    expect(await cerbCoin.balanceOf(owner.address)).to.equal(ethers.parseEther("999999900"));
  });

  it("should allow approved accounts to transfer tokens", async function () {
    await cerbCoin.approve(addr1.address, ethers.parseEther("100"));
    await cerbCoin.connect(addr1).transferFrom(owner.address, addr2.address, ethers.parseEther("50"));
    expect(await cerbCoin.balanceOf(addr2.address)).to.equal(ethers.parseEther("50"));
    expect(await cerbCoin.balanceOf(owner.address)).to.equal(ethers.parseEther("999999950"));
  });

  it("should allow the owner to sell tokens offline", async function () {
    await cerbCoin.sellOffline(addr1.address, 100);
    expect(await cerbCoin.balanceOf(addr1.address)).to.equal(ethers.parseEther("100"));
    expect(await cerbCoin.remaining()).to.equal(ethers.parseEther("999999900"));
  });
});
