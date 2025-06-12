const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("EncryptedToken Contract", function () {
  let EncryptedToken, encryptedToken, owner, addr1, addr2;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    const EncryptedTokenFactory = await ethers.getContractFactory("contracts/2018-14087.sol:EncryptedToken");
    encryptedToken = await EncryptedTokenFactory.deploy();
  });

  it("should set the correct owner", async function () {
    expect(await encryptedToken.owner()).to.equal(owner.address);
  });

  it("should transfer tokens between accounts", async function () {
    await encryptedToken.transfer(addr1.address, 1000);
    expect(await encryptedToken.balanceOfa(addr1.address)).to.equal(1000);
  });

  it("should not allow transfer from frozen accounts", async function () {
    await encryptedToken.freezeAccount(addr1.address, true);
    await expect(encryptedToken.transfer(addr1.address, 1000)).to.be.reverted;
  });

  it("should mint new tokens", async function () {
    await encryptedToken.mintToken(addr1.address, 5000);
    expect(await encryptedToken.balanceOfa(addr1.address)).to.equal(5000);
  });

  it("should freeze and unfreeze accounts", async function () {
    await encryptedToken.freezeAccount(addr1.address, true);
    expect(await encryptedToken.frozenAccount(addr1.address)).to.equal(true);

    await encryptedToken.freezeAccount(addr1.address, false);
    expect(await encryptedToken.frozenAccount(addr1.address)).to.equal(false);
  });

  it("should set a new buy price", async function () {
    await encryptedToken.setPrices(ethers.parseEther("0.001"));
    expect(await encryptedToken.buyPrice()).to.equal(ethers.parseEther("0.001"));
  });

  it("should allow buying tokens", async function () {
    const [owner] = await ethers.getSigners();

    // Zet de prijs per token
    await encryptedToken.setPrices(ethers.parseEther("0.001"));

    // Zorg dat het contract tokens bezit om te verkopen
    await encryptedToken.transfer(encryptedToken.target, ethers.parseEther("1000"));

    // Voer de aankoop uit
    await encryptedToken.buy({ value: ethers.parseEther("1") });

    // Controleer of de koper tokens heeft ontvangen
    const balance = await encryptedToken.balanceOf(owner.address);
    expect(balance).to.be.above(0n);
  });

  it("should allow the owner to withdraw ETH", async function () {
    const initialBalance = await ethers.provider.getBalance(owner.address);
    await encryptedToken.getEth(ethers.parseEther("1"));
    const finalBalance = await ethers.provider.getBalance(owner.address);
    expect(finalBalance).to.be.closeTo(initialBalance, ethers.parseEther("0.001"));  // close to because of gasPrice
  });

  it("should not allow non-owners to call owner-only functions", async function () {
    await expect(encryptedToken.connect(addr1).mintToken(addr1.address, 1000)).to.be.reverted;
    await expect(encryptedToken.connect(addr1).freezeAccount(addr2.address, true)).to.be.reverted;
    await expect(encryptedToken.connect(addr1).setPrices(ethers.parseEther("0.001"))).to.be.reverted;
    await expect(encryptedToken.connect(addr1).selfdestructs()).to.be.reverted;
  });

  it("should allow transfer to the zero address", async function () {
    await encryptedToken.transfer(addr1.address, 1000);
    await encryptedToken.connect(addr1).burn(100);
    expect(await encryptedToken.balanceOfa(addr1.address)).to.equal(900);
  });

  it("should not allow transfer if frozen", async function () {
    await encryptedToken.freezeAccount(addr1.address, true);
    await expect(encryptedToken.transfer(addr1.address, 1000)).to.be.reverted;
  });
});
