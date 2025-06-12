const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("JiucaiToken Contract", function () {
  let owner, addr1, addr2, JiucaiToken, token;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    const initialSupply = 1000;
    const initialDecimals = 18;
    const tokenName = "JiucaiToken";
    const tokenSymbol = "JCT";

    JiucaiToken = await ethers.getContractFactory("JiucaiToken");
    token = await JiucaiToken.deploy(
      initialSupply,
      initialDecimals,
      tokenName,
      tokenSymbol
    );
  });

  it("Should initialize with correct values", async function () {
    expect(await token.name()).to.equal("JiucaiToken");
    expect(await token.symbol()).to.equal("JCT");
    expect(await token.decimals()).to.equal(18);
    expect(await token.totalSupply()).to.equal(ethers.parseEther("1000"));
    expect(await token.balanceOf(owner.address)).to.equal(
      ethers.parseEther("1000")
    );
  });

  it("Should transfer tokens between accounts", async function () {
    await token.transfer(addr1.address, ethers.parseEther("100"));
    expect(await token.balanceOf(addr1.address)).to.equal(
      ethers.parseEther("100")
    );
    expect(await token.balanceOf(owner.address)).to.equal(
      ethers.parseEther("900")
    );
  });

  it("Should not allow transfer from frozen accounts", async function () {
    await token.freezeAccount(addr1.address, true);
    await expect(
      token.connect(addr1).transfer(addr2.address, ethers.parseEther("10"))
    ).to.be.reverted;
  });

  it("Should mint new tokens", async function () {
    await token.mintToken(addr1.address, ethers.parseEther("500"));
    expect(await token.totalSupply()).to.equal(ethers.parseEther("1500"));
    expect(await token.balanceOf(addr1.address)).to.equal(
      ethers.parseEther("500")
    );
  });

  it("Should allow account freezing and unfreezing", async function () {
    await token.freezeAccount(addr1.address, true);
    expect(await token.frozenAccount(addr1.address)).to.equal(true);

    await token.freezeAccount(addr1.address, false);
    expect(await token.frozenAccount(addr1.address)).to.equal(false);
  });

  it("Should allow buying tokens", async function () {
    // Zorg dat het contract tokens bezit om te verkopen
    await token.transfer(token.target, ethers.parseEther("1"));

    const price = await token.price();
    await token.buy({ value: price });

    // De koper krijgt 1 token
    expect(await token.balanceOf(owner.address)).to.equal(ethers.parseEther("999.000000000000000001"));
    // aangezien koper 1 token krijgt, is er nog 999999999999999999 resterend. Gebruik komma voor de 18 decimals
    expect(await token.balanceOf(await token.getAddress())).to.equal(ethers.parseEther("0.999999999999999999"));
  });

  it("Should update prices correctly", async function () {
    await token.setPrices(
      ethers.parseEther("0.02"),
      ethers.parseEther("0.01"),
      ethers.parseEther("0.03")
    );
    expect(await token.price()).to.equal(ethers.parseEther("0.02"));
    expect(await token.priceInc()).to.equal(ethers.parseEther("0.01"));
    expect(await token.transferFees()).to.equal(ethers.parseEther("0.03"));
  });

  it("Should not allow setting invalid prices", async function () {
    await expect(
      token.setPrices(
        ethers.parseEther("0.02"),
        ethers.parseEther("0.03"),
        ethers.parseEther("0.01")
      )
    ).to.be.reverted;
  });
});
