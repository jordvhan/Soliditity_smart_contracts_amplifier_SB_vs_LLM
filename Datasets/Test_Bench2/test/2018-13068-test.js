const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("AzurionToken", function () {
  let AzurionToken, azurionToken, owner, addr1, addr2;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    const initialSupply = ethers.parseEther("1000");
    AzurionToken = await ethers.getContractFactory("AzurionToken");
    azurionToken = await AzurionToken.deploy(initialSupply, owner.address);
  });

  it("should set the correct owner", async function () {
    expect(await azurionToken.owner()).to.equal(owner.address);
  });

  it("should assign the initial supply to the owner", async function () {
    const ownerBalance = await azurionToken.balanceOf(owner.address);
    expect(ownerBalance).to.equal(ethers.parseEther("1000"));
  });

  it("should transfer tokens between accounts", async function () {
    await azurionToken.transfer(addr1.address, ethers.parseEther("100"));
    expect(await azurionToken.balanceOf(addr1.address)).to.equal(ethers.parseEther("100"));
    expect(await azurionToken.balanceOf(owner.address)).to.equal(ethers.parseEther("900"));
  });

  it("should fail if sender does not have enough balance", async function () {
    await expect(
      azurionToken.connect(addr1).transfer(addr2.address, ethers.parseEther("1"))
    ).to.be.reverted;
  });

  it("should allow owner to mint tokens", async function () {
    await azurionToken.mintToken(addr1.address, ethers.parseEther("500"));
    expect(await azurionToken.balanceOf(addr1.address)).to.equal(ethers.parseEther("500"));
    expect(await azurionToken.totalSupply()).to.equal(ethers.parseEther("1500"));
  });

  it("should allow owner to freeze and unfreeze accounts", async function () {
    await azurionToken.freezeAccount(addr1.address, true);
    await expect(
      azurionToken.connect(addr1).transfer(addr2.address, ethers.parseEther("1"))
    ).to.be.reverted;
    await azurionToken.freezeAccount(addr1.address, false);
    await azurionToken.transfer(addr1.address, ethers.parseEther("100"));
    await azurionToken.connect(addr1).transfer(addr2.address, ethers.parseEther("50"));
    expect(await azurionToken.balanceOf(addr2.address)).to.equal(ethers.parseEther("50"));
  });

  it("should allow burning tokens by the owner", async function () {
    await azurionToken.burn(ethers.parseEther("100"));
    expect(await azurionToken.balanceOf(owner.address)).to.equal(ethers.parseEther("900"));
    expect(await azurionToken.totalSupply()).to.equal(ethers.parseEther("900"));
  });

  it("should allow burning tokens from another account by the owner", async function () {
    await azurionToken.transfer(addr1.address, ethers.parseEther("100"));
    await azurionToken.connect(addr1).approve(owner.address, ethers.parseEther("50"));
    await azurionToken.burnFrom(addr1.address, ethers.parseEther("50"));
    expect(await azurionToken.balanceOf(addr1.address)).to.equal(ethers.parseEther("50"));
    expect(await azurionToken.totalSupply()).to.equal(ethers.parseEther("950"));
  });

  it("should approve and allow transferFrom", async function () {
    await azurionToken.approve(addr1.address, ethers.parseEther("100"));
    await azurionToken.connect(addr1).transferFrom(owner.address, addr2.address, ethers.parseEther("100"));
    expect(await azurionToken.balanceOf(addr2.address)).to.equal(ethers.parseEther("100"));
    expect(await azurionToken.balanceOf(owner.address)).to.equal(ethers.parseEther("900"));
  });

  it("should allow owner to transfer ownership", async function () {
    await azurionToken.transferOwnership(addr1.address);
    expect(await azurionToken.owner()).to.equal(addr1.address);
  });

  it("should fail to transfer tokens to the zero address", async function () {
    await expect(
      azurionToken.transfer("0x0000000000000000000000000000000000000000", ethers.parseEther("10"))
    ).to.be.reverted;
  });

  it("should fail to transfer tokens if frozen", async function () {
    await azurionToken.freezeAccount(owner.address, true);
    await expect(azurionToken.transfer(addr1.address, ethers.parseEther("10"))).to.be.reverted;
  });

  it("should fail to mint tokens if not owner", async function () {
    const mintAmount = ethers.parseEther("100");
    await expect(azurionToken.connect(addr1).mintToken(addr1.address, mintAmount)).to.be.reverted;
  });

  it("should fail to freeze account if not owner", async function () {
    await expect(azurionToken.connect(addr1).freezeAccount(addr1.address, true)).to.be.reverted;
  });

  it("should fail to burn tokens if not owner", async function () {
    const burnAmount = ethers.parseEther("100");
    await expect(azurionToken.connect(addr1).burn(burnAmount)).to.be.reverted;
  });

  it("should fail to burn tokens from another account if not owner", async function () {
    const burnAmount = ethers.parseEther("100");
    await azurionToken.transfer(addr1.address, burnAmount);
    await azurionToken.connect(addr1).approve(owner.address, burnAmount);
    await expect(azurionToken.connect(addr1).burnFrom(addr1.address, burnAmount)).to.be.reverted;
  });

  it("should fail to transfer ownership if not owner", async function () {
    await expect(azurionToken.connect(addr1).transferOwnership(addr2.address)).to.be.reverted;
  });
});
