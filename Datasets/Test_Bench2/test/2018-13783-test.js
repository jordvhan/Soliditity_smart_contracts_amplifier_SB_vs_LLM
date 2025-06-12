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
    await token.transfer(token.target, ethers.parseEther("1"));

    const price = await token.price();
    await token.buy({ value: price });

    expect(await token.balanceOf(owner.address)).to.equal(ethers.parseEther("999.000000000000000001"));
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

  it("Should not allow selling tokens if amount is not 1", async function () {
    await expect(token.sell(2)).to.be.reverted;
  });

  it("Should allow killing the contract", async function () {
    await token.kill();
  });

  it("Should prevent non-owner from killing the contract", async function () {
    await expect(token.connect(addr1).kill()).to.be.reverted;
  });

  it("Should prevent transfer to the zero address", async function () {
    await expect(
      token.transfer("0x0000000000000000000000000000000000000000", ethers.parseEther("10"))
    ).to.be.reverted;
  });

  it("Should test burnFrom", async function () {
    await token.approve(addr1.address, ethers.parseEther("500"));
    await token.connect(addr1).burnFrom(owner.address, ethers.parseEther("100"));
    expect(await token.balanceOf(owner.address)).to.equal(ethers.parseEther("900"));
    expect(await token.totalSupply()).to.equal(ethers.parseEther("900"));
  });

  it("Should not allow setting prices if transferFees is not greater than priceInc", async function () {
    await expect(token.setPrices(ethers.parseEther("0.01"), ethers.parseEther("0.02"), ethers.parseEther("0.01"))).to.be.reverted;
  });

  it("Should test the Transfer event", async function () {
    await expect(token.transfer(addr1.address, ethers.parseEther("100")))
        .to.emit(token, "Transfer")
        .withArgs(owner.address, addr1.address, ethers.parseEther("100"));
  });

  it("Should test the FrozenFunds event", async function () {
    await expect(token.freezeAccount(addr1.address, true))
        .to.emit(token, "FrozenFunds")
        .withArgs(addr1.address, true);
  });

  it("Should test the transferOwnership function", async function () {
    await token.transferOwnership(addr1.address);
    expect(await token.owner()).to.equal(addr1.address);
  });

  it("Should prevent non-owner from transfering ownership", async function () {
    await expect(token.connect(addr1).transferOwnership(addr2.address)).to.be.reverted;
  });

  it("Should test transferFrom failing if _from is frozen", async function () {
    await token.freezeAccount(owner.address, true);
    await token.approve(addr1.address, ethers.parseEther("500"));
    await expect(token.connect(addr1).transferFrom(owner.address, addr2.address, ethers.parseEther("100"))).to.be.reverted;
  });

  it("Should test transfer failing if _to is frozen", async function () {
    await token.freezeAccount(addr1.address, true);
    await expect(token.transfer(addr1.address, ethers.parseEther("100"))).to.be.reverted;
  });

  it("Should test mintToken event", async function () {
    await expect(token.mintToken(addr1.address, ethers.parseEther("500")))
        .to.emit(token, "Transfer")
        .withArgs(token.target, addr1.address, ethers.parseEther("500"));
  });

  it("Should test setPrices function", async function () {
    await token.setPrices(ethers.parseEther("0.02"), ethers.parseEther("0.01"), ethers.parseEther("0.03"));
    expect(await token.price()).to.equal(ethers.parseEther("0.02"));
    expect(await token.priceInc()).to.equal(ethers.parseEther("0.01"));
    expect(await token.transferFees()).to.equal(ethers.parseEther("0.03"));
  });
});
