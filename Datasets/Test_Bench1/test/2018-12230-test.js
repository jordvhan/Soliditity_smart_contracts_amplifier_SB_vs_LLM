const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("RemiCoin Contract", function () {
  let RemiCoin, remiCoin, owner, addr1, addr2;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    RemiCoin = await ethers.getContractFactory("contracts/2018-12230.sol:RemiCoin");
    remiCoin = await RemiCoin.deploy(
      ethers.parseEther("1000"), // initial supply
      "RemiCoin",
      "RMC",
      18
    );
  });

  it("Should set the correct owner", async function () {
    expect(await remiCoin.owner()).to.equal(owner.address);
  });

  it("Should assign the initial supply to the owner", async function () {
    const ownerBalance = await remiCoin.balanceOf(owner.address);
    expect(ownerBalance).to.equal(ethers.parseEther("1000"));
  });

  it("Should transfer tokens between accounts", async function () {
    await remiCoin.transfer(addr1.address, ethers.parseEther("100"));
    const addr1Balance = await remiCoin.balanceOf(addr1.address);
    expect(addr1Balance).to.equal(ethers.parseEther("100"));
  });

  it("Should fail if sender does not have enough tokens", async function () {
    const initialBalance1 = await remiCoin.balanceOf(addr1.address);
    const initialBalance2 = await remiCoin.balanceOf(addr2.address);

    // Probeer de transfer, verwacht dat deze stilletjes faalt
    const success = await remiCoin.connect(addr1).transfer(addr2.address, ethers.parseEther("1"));
    //expect(success).to.equal(false);

    const finalBalance1 = await remiCoin.balanceOf(addr1.address);
    const finalBalance2 = await remiCoin.balanceOf(addr2.address);

    expect(finalBalance1).to.equal(initialBalance1);
    expect(finalBalance2).to.equal(initialBalance2);
  });

  it("Should mint new tokens", async function () {
    await remiCoin.mintToken(addr1.address, ethers.parseEther("500"));
    const addr1Balance = await remiCoin.balanceOf(addr1.address);
    expect(addr1Balance).to.equal(ethers.parseEther("500"));
  });

  it("Should freeze and unfreeze accounts", async function () {
    await remiCoin.freezeAccount(addr1.address, true);
    expect(await remiCoin.frozenAccount(addr1.address)).to.be.true;

    await remiCoin.freezeAccount(addr1.address, false);
    expect(await remiCoin.frozenAccount(addr1.address)).to.be.false;
  });

  it("Should allow owner to transfer ownership", async function () {
    await remiCoin.transferOwnership(addr1.address);
    expect(await remiCoin.owner()).to.equal(addr1.address);
  });

  it("Should change token name, symbol, and decimals", async function () {
    await remiCoin.changeName("NewRemiCoin");
    expect(await remiCoin.name()).to.equal("NewRemiCoin");

    await remiCoin.changeSymbol("NRC");
    expect(await remiCoin.symbol()).to.equal("NRC");

    await remiCoin.changeDecimals(8);
    expect(await remiCoin.decimals()).to.equal(8);
  });
});
