const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ATL Contract", function () {
  let ATL, atl, owner, ico, addr1, addr2;

  beforeEach(async function () {
    [owner, ico, addr1, addr2] = await ethers.getSigners();
    const ATLContract = await ethers.getContractFactory("ATL");
    atl = await ATLContract.deploy(ico.address);
  });

  it("Should set the correct ICO address", async function () {
    expect(await atl.ico()).to.equal(ico.address);
  });

  it("Should mint tokens correctly", async function () {
    const mintAmount = ethers.parseEther("100");
    await atl.connect(ico).mint(addr1.address, mintAmount);
    expect(await atl.balanceOf(addr1.address)).to.equal(mintAmount);
    expect(await atl.totalSupply()).to.equal(mintAmount);
  });

  it("Should not allow non-ICO to mint tokens", async function () {
    const mintAmount = ethers.parseEther("100");
    await expect(atl.connect(addr1).mint(addr1.address, mintAmount)).to.be.reverted;
  });

  it("Should unfreeze tokens correctly", async function () {
    await atl.connect(ico).unfreeze();
    expect(await atl.tokensAreFrozen()).to.be.false;
  });

  it("Should not allow transfers when tokens are frozen", async function () {
    const mintAmount = ethers.parseEther("100");
    await atl.connect(ico).mint(addr1.address, mintAmount);
    await expect(atl.connect(addr1).transfer(addr2.address, ethers.parseEther("10"))).to.be.reverted;
  });

  it("Should allow transfers when tokens are unfrozen", async function () {
    const mintAmount = ethers.parseEther("100");
    await atl.connect(ico).mint(addr1.address, mintAmount);
    await atl.connect(ico).unfreeze();
    await atl.connect(addr1).transfer(addr2.address, ethers.parseEther("10"));
    expect(await atl.balanceOf(addr1.address)).to.equal(ethers.parseEther("90"));
    expect(await atl.balanceOf(addr2.address)).to.equal(ethers.parseEther("10"));
  });

  it("Should allow transferFrom when tokens are unfrozen", async function () {
    const mintAmount = ethers.parseEther("100");
    await atl.connect(ico).mint(addr1.address, mintAmount);
    await atl.connect(ico).unfreeze();
    await atl.connect(addr1).approve(addr2.address, ethers.parseEther("50"));
    await atl.connect(addr2).transferFrom(addr1.address, addr2.address, ethers.parseEther("20"));
    expect(await atl.balanceOf(addr1.address)).to.equal(ethers.parseEther("80"));
    expect(await atl.balanceOf(addr2.address)).to.equal(ethers.parseEther("20"));
  });

  it("Should not allow minting beyond the token limit", async function () {
    const tokenLimit = ethers.parseEther("150000000");
    await atl.connect(ico).mint(addr1.address, tokenLimit);
    await expect(atl.connect(ico).mint(addr1.address, ethers.parseEther("1"))).to.be.reverted;
  });

  it("Should not allow minting tokens if total supply exceeds limit", async function () {
    const tokenLimit = ethers.parseEther("150000000");
    await atl.connect(ico).mint(addr1.address, tokenLimit);
    await expect(atl.connect(ico).mint(addr1.address, ethers.parseEther("1"))).to.be.reverted;
  });

  it("Should not allow unfreeze by non-ICO address", async function () {
    await expect(atl.connect(addr1).unfreeze()).to.be.reverted;
  });

  it("Should emit Transfer event on successful transfer", async function () {
    const mintAmount = ethers.parseEther("100");
    await atl.connect(ico).mint(addr1.address, mintAmount);
    await atl.connect(ico).unfreeze();
    await expect(atl.connect(addr1).transfer(addr2.address, ethers.parseEther("10")))
      .to.emit(atl, "Transfer")
      .withArgs(addr1.address, addr2.address, ethers.parseEther("10"));
  });

  it("Should emit Approval event on successful approval", async function () {
    const mintAmount = ethers.parseEther("100");
    await atl.connect(ico).mint(addr1.address, mintAmount);
    await atl.connect(ico).unfreeze();
    await expect(atl.connect(addr1).approve(addr2.address, ethers.parseEther("50")))
      .to.emit(atl, "Approval")
      .withArgs(addr1.address, addr2.address, ethers.parseEther("50"));
  });

  it("Should not allow approve when tokens are frozen", async function () {
    const mintAmount = ethers.parseEther("100");
    await atl.connect(ico).mint(addr1.address, mintAmount);
    await expect(atl.connect(addr1).approve(addr2.address, ethers.parseEther("50"))).to.be.reverted;
  });

  it("Should correctly return the ICO address", async function () {
    expect(await atl.ico()).to.equal(ico.address);
  });

  it("Should correctly return the token freeze status", async function () {
    expect(await atl.tokensAreFrozen()).to.be.true;
    await atl.connect(ico).unfreeze();
    expect(await atl.tokensAreFrozen()).to.be.false;
  });

  it("Should not allow minting zero tokens", async function () {
    await expect(atl.connect(ico).mint(addr1.address, 0)).to.be.reverted;
  });

  it("Should handle transfer to the same address", async function () {
    const mintAmount = ethers.parseEther("100");
    await atl.connect(ico).mint(addr1.address, mintAmount);
    await atl.connect(ico).unfreeze();
    await atl.connect(addr1).transfer(addr1.address, ethers.parseEther("10"));
    expect(await atl.balanceOf(addr1.address)).to.equal(mintAmount);
  });

  it("Should handle transferFrom to the same address", async function () {
    const mintAmount = ethers.parseEther("100");
    await atl.connect(ico).mint(addr1.address, mintAmount);
    await atl.connect(ico).unfreeze();
    await atl.connect(addr1).approve(addr2.address, ethers.parseEther("50"));
    await atl.connect(addr2).transferFrom(addr1.address, addr1.address, ethers.parseEther("20"));
    expect(await atl.balanceOf(addr1.address)).to.equal(mintAmount);
  });

  it("Should not allow transferFrom more than allowance", async function () {
    const mintAmount = ethers.parseEther("100");
    await atl.connect(ico).mint(addr1.address, mintAmount);
    await atl.connect(ico).unfreeze();
    await atl.connect(addr1).approve(addr2.address, ethers.parseEther("50"));
    await expect(atl.connect(addr2).transferFrom(addr1.address, addr2.address, ethers.parseEther("60"))).to.be.reverted;
  });

  it("Should allow approve and then set to zero", async function () {
    const mintAmount = ethers.parseEther("100");
    await atl.connect(ico).mint(addr1.address, mintAmount);
    await atl.connect(ico).unfreeze();
    await atl.connect(addr1).approve(addr2.address, ethers.parseEther("50"));
    expect(await atl.allowance(addr1.address, addr2.address)).to.equal(ethers.parseEther("50"));
    await atl.connect(addr1).approve(addr2.address, 0);
    expect(await atl.allowance(addr1.address, addr2.address)).to.equal(0);
  });

  it("Should handle multiple transfers", async function () {
    const mintAmount = ethers.parseEther("100");
    await atl.connect(ico).mint(addr1.address, mintAmount);
    await atl.connect(ico).unfreeze();
    await atl.connect(addr1).transfer(addr2.address, ethers.parseEther("10"));
    expect(await atl.balanceOf(addr1.address)).to.equal(ethers.parseEther("90"));
    expect(await atl.balanceOf(addr2.address)).to.equal(ethers.parseEther("10"));
    await atl.connect(addr2).transfer(addr1.address, ethers.parseEther("5"));
    expect(await atl.balanceOf(addr1.address)).to.equal(ethers.parseEther("95"));
    expect(await atl.balanceOf(addr2.address)).to.equal(ethers.parseEther("5"));
  });

  it("Should handle multiple transferFrom", async function () {
    const mintAmount = ethers.parseEther("100");
    await atl.connect(ico).mint(addr1.address, mintAmount);
    await atl.connect(ico).unfreeze();
    await atl.connect(addr1).approve(addr2.address, ethers.parseEther("50"));
    await atl.connect(addr2).transferFrom(addr1.address, addr2.address, ethers.parseEther("20"));
    expect(await atl.balanceOf(addr1.address)).to.equal(ethers.parseEther("80"));
    expect(await atl.balanceOf(addr2.address)).to.equal(ethers.parseEther("20"));
    await atl.connect(addr2).transferFrom(addr1.address, addr2.address, ethers.parseEther("10"));
    expect(await atl.balanceOf(addr1.address)).to.equal(ethers.parseEther("70"));
    expect(await atl.balanceOf(addr2.address)).to.equal(ethers.parseEther("30"));
  });
});
