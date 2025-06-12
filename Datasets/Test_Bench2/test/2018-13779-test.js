const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("YLCToken", function () {
  let owner, addr1, addr2, token;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    const YLCToken = await ethers.getContractFactory("YLCToken");
    token = await YLCToken.deploy(
      1000, // initialSupply
      "TestToken",
      18,
      "TTK"
    );
    await token.waitForDeployment(); // voorkomt null address fouten
  });

  it("Should deploy with correct initial values", async function () {
    expect(await token.name()).to.equal("TestToken");
    expect(await token.symbol()).to.equal("TTK");
    expect(await token.decimals()).to.equal(18);
    expect(await token.totalSupply()).to.equal(1000);
    expect(await token.balanceOf(await owner.getAddress())).to.equal(1000);
  });

  it("Should transfer tokens between accounts", async function () {
    await token.transfer(await addr1.getAddress(), 100);
    expect(await token.balanceOf(await owner.getAddress())).to.equal(900);
    expect(await token.balanceOf(await addr1.getAddress())).to.equal(100);
  });

  it("Should not allow transfer if sender has insufficient balance", async function () {
    await expect(token.connect(addr1).transfer(await addr2.getAddress(), 100)).to.be.reverted;
  });

  it("Should allow owner to mint tokens", async function () {
    await token.mintToken(await addr1.getAddress(), 500);
    expect(await token.totalSupply()).to.equal(1500);
    expect(await token.balanceOf(await addr1.getAddress())).to.equal(500);
  });

  it("Should allow owner to freeze accounts", async function () {
    await token.freezeAccount(await addr1.getAddress(), true);
    await expect(token.connect(addr1).transfer(await addr2.getAddress(), 100)).to.be.reverted;
  });

  it("Should allow owner to set buy and sell prices", async function () {
    await token.setPrices(ethers.parseEther("0.01"), ethers.parseEther("0.02"));
    expect(await token.sellPrice()).to.equal(ethers.parseEther("0.01"));
    expect(await token.buyPrice()).to.equal(ethers.parseEther("0.02"));
  });

  it("Should allow users to buy tokens", async function () {
    await token.setPrices(ethers.parseEther("0.01"), ethers.parseEther("0.02"));
    await token.transfer(await token.getAddress(), 500); // fund contract

    await token.connect(addr1).buy({ value: ethers.parseEther("1") });

    const balance = await token.balanceOf(await addr1.getAddress());
    expect(balance).to.equal(50); // 1 / 0.02 = 50
  });

  it("Should allow owner to burn tokens", async function () {
    await token.burn(100);
    expect(await token.totalSupply()).to.equal(900);
    expect(await token.balanceOf(await owner.getAddress())).to.equal(900);
  });

  it("Should prevent accidental Ether transfers", async function () {
    await expect(
      addr1.sendTransaction({
        to: await token.getAddress(),
        value: ethers.parseEther("1"),
      })
    ).to.be.reverted;
  });

  it("Should handle transfer of zero tokens", async function () {
    await token.transfer(await addr1.getAddress(), 0);
    expect(await token.balanceOf(await addr1.getAddress())).to.equal(0);
  });

  it("Should handle minting zero tokens", async function () {
    const initialTotalSupply = await token.totalSupply();
    await token.mintToken(await addr1.getAddress(), 0);
    expect(await token.balanceOf(await addr1.getAddress())).to.equal(0);
    expect(await token.totalSupply()).to.equal(initialTotalSupply);
  });

  it("Should handle freezing and unfreezing the owner's account", async function () {
    await token.freezeAccount(owner.address, true);
    expect(await token.frozenAccount(owner.address)).to.equal(true);

    await token.freezeAccount(owner.address, false);
    expect(await token.frozenAccount(owner.address)).to.equal(false);
  });

  it("Should handle setting same prices for buying and selling", async function () {
    await token.setPrices(ethers.parseEther("0.01"), ethers.parseEther("0.01"));
    expect(await token.sellPrice()).to.equal(ethers.parseEther("0.01"));
    expect(await token.buyPrice()).to.equal(ethers.parseEther("0.01"));
  });

  it("Should handle setting zero prices", async function () {
    await token.setPrices(0, 0);
    expect(await token.sellPrice()).to.equal(0);
    expect(await token.buyPrice()).to.equal(0);
  });

  it("Should handle burning zero tokens", async function () {
    const initialBalance = await token.balanceOf(owner.address);
    await token.burn(0);
    expect(await token.totalSupply()).to.equal(1000);
    expect(await token.balanceOf(owner.address)).to.equal(initialBalance);
  });

  it("Should handle burning all tokens", async function () {
    const initialBalance = await token.balanceOf(owner.address);
    await token.burn(initialBalance);
    expect(await token.totalSupply()).to.equal(0);
    expect(await token.balanceOf(owner.address)).to.equal(0);
  });

  it("Should handle buying with a small amount", async function () {
    await token.setPrices(ethers.parseEther("0.1"), ethers.parseEther("0.2"));
    await token.transfer(token.target, 500);
    await token.connect(addr1).buy({ value: ethers.parseEther("0.01") });
    expect(await token.balanceOf(addr1.address)).to.equal(0);
  });

  it("Should handle transferFrom with sufficient allowance", async function () {
    await token.approve(addr1.address, 500);
    await token.connect(addr1).transferFrom(owner.address, addr2.address, 100);
    expect(await token.balanceOf(addr2.address)).to.equal(100);
    expect(await token.balanceOf(owner.address)).to.equal(900);
  });

  it("Should handle transferFrom with zero allowance", async function () {
    await expect(token.connect(addr1).transferFrom(owner.address, addr2.address, 100)).to.be.reverted;
  });

  it("Should handle transferFrom with insufficient allowance", async function () {
    await token.approve(addr1.address, 50);
    await expect(token.connect(addr1).transferFrom(owner.address, addr2.address, 100)).to.be.reverted;
  });
});
