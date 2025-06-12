const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MyAdvancedToken", function () {
  let Token, token, owner, addr1, addr2;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    Token = await ethers.getContractFactory("contracts/2018-12079.sol:MyAdvancedToken");
    token = await Token.deploy(
      ethers.parseEther("1000"), // initialSupply
      "TestToken",              // tokenName
      18,                       // decimalUnits
      "TT"                      // tokenSymbol
    );
  });

  it("Should deploy with correct initial values", async function () {
    expect(await token.name()).to.equal("TestToken");
    expect(await token.symbol()).to.equal("TT");
    expect(await token.decimals()).to.equal(18);
    expect(await token.totalSupply()).to.equal(ethers.parseEther("1000"));
    expect(await token.balanceOf(owner.address)).to.equal(ethers.parseEther("1000"));
  });

  it("Should transfer tokens between accounts", async function () {
    await token.transfer(addr1.address, ethers.parseEther("100"));
    expect(await token.balanceOf(addr1.address)).to.equal(ethers.parseEther("100"));
    expect(await token.balanceOf(owner.address)).to.equal(ethers.parseEther("900"));
  });

  it("Should fail if sender doesn’t have enough tokens", async function () {
    await expect(token.connect(addr1).transfer(addr2.address, ethers.parseEther("1"))).to.be.reverted;
  });

  it("Should allow owner to mint tokens", async function () {
    await token.mintToken(addr1.address, ethers.parseEther("500"));
    expect(await token.balanceOf(addr1.address)).to.equal(ethers.parseEther("500"));
    expect(await token.totalSupply()).to.equal(ethers.parseEther("1500"));
  });

  it("Should allow owner to freeze and unfreeze accounts", async function () {
    await token.freezeAccount(addr1.address, true);
    await expect(token.connect(addr1).transfer(addr2.address, ethers.parseEther("1"))).to.be.reverted;

    await token.freezeAccount(addr1.address, false);
    await token.transfer(addr1.address, ethers.parseEther("100"));
    await token.connect(addr1).transfer(addr2.address, ethers.parseEther("50"));
    expect(await token.balanceOf(addr2.address)).to.equal(ethers.parseEther("50"));
  });

  it("Should allow owner to set buy and sell prices", async function () {
    await token.setPrices(ethers.parseEther("0.01"), ethers.parseEther("0.02"));
    expect(await token.sellPrice()).to.equal(ethers.parseEther("0.01"));
    expect(await token.buyPrice()).to.equal(ethers.parseEther("0.02"));
  });

  it("Should prevent buying if contract has insufficient tokens", async function () {
    await token.setPrices(ethers.parseEther("0.01"), ethers.parseEther("0.02"));
    await expect(token.connect(addr1).buy({ value: ethers.parseEther("1") })).to.be.reverted;
  });

  it("Should prevent selling if user has insufficient tokens", async function () {
    await token.setPrices(ethers.parseEther("0.01"), ethers.parseEther("0.02"));
    await expect(token.connect(addr1).sell(ethers.parseEther("1"))).to.be.reverted;
  });

  it("Should allow transferFrom after approval", async function () {
    await token.approve(addr1.address, ethers.parseEther("100"));
    await token.connect(addr1).transferFrom(owner.address, addr2.address, ethers.parseEther("50"));
    expect(await token.balanceOf(addr2.address)).to.equal(ethers.parseEther("50"));
    expect(await token.balanceOf(owner.address)).to.equal(ethers.parseEther("950"));
  });

  it("Should fail transferFrom if allowance is insufficient", async function () {
    await token.approve(addr1.address, ethers.parseEther("10"));
    await expect(token.connect(addr1).transferFrom(owner.address, addr2.address, ethers.parseEther("20"))).to.be.reverted;
  });
});
