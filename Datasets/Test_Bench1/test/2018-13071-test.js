const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CCindexToken", function () {
  let CCindexToken, token, owner, addr1, addr2, addr3;

  beforeEach(async function () {
    [owner, addr1, addr2, addr3] = await ethers.getSigners();
    const Token = await ethers.getContractFactory("CCindexToken");
    token = await Token.deploy();
  });

  it("Should deploy with correct initial supply", async function () {
    const totalSupply = await token.totalSupply();
    expect(totalSupply).to.equal(ethers.parseEther("40000000"));
  });

  it("Should allow transfers between accounts", async function () {
    await token.transfer(addr1.address, ethers.parseEther("100"));
    expect(await token.balanceOf(addr1.address)).to.equal(ethers.parseEther("100"));
  });

  it("Should not allow transfers from frozen accounts", async function () {
    await token.freezeAccount(addr1.address, true);
    await expect(token.connect(addr1).transfer(addr2.address, ethers.parseEther("10"))).to.be.reverted;
  });

  it("Should allow approvals and transferFrom", async function () {
    await token.approve(addr1.address, ethers.parseEther("50"));
    await token.connect(addr1).transferFrom(owner.address, addr2.address, ethers.parseEther("50"));
    expect(await token.balanceOf(addr2.address)).to.equal(ethers.parseEther("50"));
  });

  it("Should allow minting of new tokens", async function () {
    await token.mintToken(addr1.address, ethers.parseEther("100"));
    expect(await token.balanceOf(addr1.address)).to.equal(ethers.parseEther("100"));
  });

  it("Should allow freezing and unfreezing of accounts", async function () {
    await token.freezeAccount(addr1.address, true);
    expect(await token.frozenAccount(addr1.address)).to.equal(true);
    await token.freezeAccount(addr1.address, false);
    expect(await token.frozenAccount(addr1.address)).to.equal(false);
  });

it("Should distribute tokens correctly", async function () {
    await token.transfer(addr1.address, ethers.parseEther("100"));
    await token.transfer(addr2.address, ethers.parseEther("200"));

    // Voer distributie uit
    await token.distributeTokens(0, 2);

    // Vraag hierna het totaal gedistribueerde bedrag op (bijv. via een publieke variabele of berekening)
    // Stel dat je deze logica zelf moet maken, dan zou je dit moeten reconstrueren op basis van de nieuwe balances

    const balance1 = await token.balanceOf(addr1.address);
    const balance2 = await token.balanceOf(addr2.address);

    expect(balance1).to.equal(ethers.parseEther("103")); // +3%
    expect(balance2).to.equal(ethers.parseEther("206")); // +3%

    const distributed = balance1+balance2-ethers.parseEther("300"); // 3% van totaal

    expect(distributed).to.equal(ethers.parseEther("9"));
});


  it("Should return all token holders", async function () {
    await token.transfer(addr1.address, ethers.parseEther("100"));
    await token.transfer(addr2.address, ethers.parseEther("200"));
    const holders = await token.getAddresses();
    expect(holders).to.include(addr1.address);
    expect(holders).to.include(addr2.address);
  });
});
