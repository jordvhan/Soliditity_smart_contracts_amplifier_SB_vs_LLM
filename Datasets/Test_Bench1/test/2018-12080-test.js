const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("INTToken Contract", function () {
  let owner, addr1, addr2, token;

  beforeEach(async function () {
    const INTToken = await ethers.getContractFactory("contracts/2018-12080.sol:INTToken");
    [owner, addr1, addr2] = await ethers.getSigners();
    token = await INTToken.deploy(
      ethers.parseEther("1000000"), // initialSupply
      "Internet Node Token",       // tokenName
      6,                           // decimalUnits
      "INT"                        // tokenSymbol
    );
  });

  it("Should deploy with correct initial supply", async function () {
    const totalSupply = await token.totalSupply();
    expect(totalSupply).to.equal(ethers.parseEther("1000000"));
  });

  it("Should transfer tokens between accounts", async function () {
    await token.transfer(addr1.address, ethers.parseEther("100"));
    const balance1 = await token.balanceOf(addr1.address);
    expect(balance1).to.equal(ethers.parseEther("100"));
  });

  it("Should not allow transfer from frozen accounts", async function () {
    await token.freezeAccount(addr1.address, true);
    await expect(
      token.connect(addr1).transfer(addr2.address, ethers.parseEther("50"))
    ).to.be.reverted;
  });

  it("Should mint new tokens", async function () {
    await token.mintToken(addr1.address, ethers.parseEther("500"));
    const balance1 = await token.balanceOf(addr1.address);
    expect(balance1).to.equal(ethers.parseEther("500"));
  });

  it("Should update prices correctly", async function () {
    await token.setPrices(ethers.parseEther("0.01"), ethers.parseEther("0.02"));
    const sellPrice = await token.sellPrice();
    const buyPrice = await token.buyPrice();
    expect(sellPrice).to.equal(ethers.parseEther("0.01"));
    expect(buyPrice).to.equal(ethers.parseEther("0.02"));
  });

  it("Should burn tokens correctly", async function () {
    await token.burn(ethers.parseEther("100"));
    const totalSupply = await token.totalSupply();
    expect(totalSupply).to.equal(ethers.parseEther("999900"));
  });

  it("Should not allow burning more tokens than balance", async function () {
    await expect(token.burn(ethers.parseEther("2000000"))).to.be.reverted;
  });
});
