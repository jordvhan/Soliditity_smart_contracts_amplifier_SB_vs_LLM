const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("LinkToken Contract", function () {
  let LinkToken, linkToken, owner, addr1, addr2;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    const LinkTokenFactory = await ethers.getContractFactory("LinkToken");
    linkToken = await LinkTokenFactory.deploy();
  });

  it("Should set the correct owner", async function () {
    expect(await linkToken.owner()).to.equal(owner.address);
  });

  it("Should mint tokens correctly", async function () {
    await linkToken.mint(addr1.address, ethers.parseEther("100"));
    expect(await linkToken.totalSupply()).to.equal(ethers.parseEther("100"));
    expect(await linkToken.balanceOf(addr1.address)).to.equal(ethers.parseEther("100"));
  });

  it("Should transfer tokens correctly", async function () {
    await linkToken.mint(owner.address, ethers.parseEther("50"));
    await linkToken.transfer(addr1.address, ethers.parseEther("20"));
    expect(await linkToken.balanceOf(owner.address)).to.equal(ethers.parseEther("30"));
    expect(await linkToken.balanceOf(addr1.address)).to.equal(ethers.parseEther("20"));
  });

  it("Should not allow transfer of more tokens than balance", async function () {
    await linkToken.mint(owner.address, ethers.parseEther("10"));
    await expect(linkToken.transfer(addr1.address, ethers.parseEther("20"))).to.be.reverted;
  });

  it("Should approve and transferFrom correctly", async function () {
    await linkToken.mint(owner.address, ethers.parseEther("100"));
    await linkToken.approve(addr1.address, ethers.parseEther("50"));
    expect(await linkToken.allowance(owner.address, addr1.address)).to.equal(ethers.parseEther("50"));

    await linkToken.connect(addr1).transferFrom(owner.address, addr2.address, ethers.parseEther("30"));
    expect(await linkToken.balanceOf(owner.address)).to.equal(ethers.parseEther("70"));
    expect(await linkToken.balanceOf(addr2.address)).to.equal(ethers.parseEther("30"));
    expect(await linkToken.allowance(owner.address, addr1.address)).to.equal(ethers.parseEther("20"));
  });

  it("Should not allow transferFrom without sufficient allowance", async function () {
    await linkToken.mint(owner.address, ethers.parseEther("100"));
    await linkToken.approve(addr1.address, ethers.parseEther("10"));
    await expect(
      linkToken.connect(addr1).transferFrom(owner.address, addr2.address, ethers.parseEther("20"))
    ).to.be.reverted;
  });

  it("Should allow owner to transfer ownership", async function () {
    await linkToken.transferOwnership(addr1.address);
    expect(await linkToken.owner()).to.equal(addr1.address);
  });

  it("Should not allow non-owner to mint tokens", async function () {
    await expect(linkToken.connect(addr1).mint(addr1.address, ethers.parseEther("100"))).to.be.reverted;
  });

  it("Should not allow non-owner to transfer ownership", async function () {
    await expect(linkToken.connect(addr1).transferOwnership(addr2.address)).to.be.reverted;
  });
});
