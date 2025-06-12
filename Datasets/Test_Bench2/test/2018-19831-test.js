const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Cryptbond Contract", function () {
  let Cryptbond, cryptbond, owner, addr1, addr2, addrs;

  beforeEach(async function () {
    Cryptbond = await ethers.getContractFactory("Cryptbond");
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();
    cryptbond = await Cryptbond.deploy();
  });

  it("Should set the correct owner", async function () {
    expect(await cryptbond.owner()).to.equal(owner.address);
  });

  it("Should distribute tokens correctly", async function () {
    await cryptbond.setParameters(ethers.parseEther("1"), ethers.parseEther("0.1"));
    await cryptbond.setTotalRemaining(3000000000);
    await cryptbond.distributeAmounts([addr1.address], [1000]);
    expect(await cryptbond.balanceOf(addr1.address)).to.equal(1000);
  });

  it("Should allow token transfers", async function () {
    await cryptbond.setTotalRemaining(3000000000);
    await cryptbond.distributeAmounts([addr1.address], [1000]);
    await cryptbond.connect(addr1).transfer(addr2.address, 500);
    expect(await cryptbond.balanceOf(addr1.address)).to.equal(500);
    expect(await cryptbond.balanceOf(addr2.address)).to.equal(500);

    await cryptbond.connect(addr2).transfer(addr1.address, 500);
  });

  it("Should allow the owner to withdraw Ether", async function () {
    const initialBalance = await ethers.provider.getBalance(owner.address);

    await addr1.sendTransaction({
      to: cryptbond.target,
      value: ethers.parseEther("1")
    });

    const tx = await cryptbond.withdraw();
    const receipt = await tx.wait();
    const gasUsed = receipt.gasUsed * receipt.gasPrice;

    const finalBalance = await ethers.provider.getBalance(owner.address);
    expect(finalBalance).to.be.gt(initialBalance - gasUsed);
  });

  it("Should enable and disable whitelist correctly", async function () {
    await cryptbond.enableWhitelist([addr1.address]);
    expect(await cryptbond.blacklist(addr1.address)).to.be.false;

    await cryptbond.disableWhitelist([addr1.address]);
    expect(await cryptbond.blacklist(addr1.address)).to.be.true;

    await cryptbond.enableWhitelist([addr1.address]);
  });

  it("Should distribute amounts correctly", async function () {
    await cryptbond.setParameters(100, ethers.parseEther("0.1"));
    await cryptbond.setTotalRemaining(ethers.parseEther("1000"));

    await cryptbond.distributeAmounts([addr1.address, addr2.address], [100, 200]);

    expect(await cryptbond.balanceOf(addr1.address)).to.equal(100);
    expect(await cryptbond.balanceOf(addr2.address)).to.equal(200);
  });

  it("Should revert if non-owner tries restricted functions", async function () {
    await expect(cryptbond.connect(addr1).setParameters(100, ethers.parseEther("0.1"))).to.be.revertedWithoutReason();
    await expect(cryptbond.connect(addr1).transferOwnership(addr2.address)).to.be.reverted;
  });

  it("Should allow the owner to transfer ownership", async function () {
    await cryptbond.transferOwnership(addr1.address);
    expect(await cryptbond.owner()).to.equal(addr1.address);
  });

  it("Should not allow non-owners to transfer ownership", async function () {
    await expect(cryptbond.connect(addr1).transferOwnership(addr2.address)).to.be.reverted;
  });

  it("Should finish distribution correctly", async function () {
    expect(await cryptbond.distributionFinished()).to.be.false;
    await cryptbond.finishDistribution();
    expect(await cryptbond.distributionFinished()).to.be.true;
  });

  it("Should not allow distribution after it is finished", async function () {
    await cryptbond.finishDistribution();
    await expect(cryptbond.distributeAmounts([addr1.address], [1000])).to.be.reverted;
  });

  it("Should revert if non-owner tries to withdraw Ether", async function () {
    await expect(cryptbond.connect(addr1).withdraw()).to.be.reverted;
  });

  it("Should revert if non-owner tries to enable or disable whitelist", async function () {
    await expect(cryptbond.connect(addr1).enableWhitelist([addr2.address])).to.be.reverted;
    await expect(cryptbond.connect(addr1).disableWhitelist([addr2.address])).to.be.reverted;
  });

  it("Should revert if non-owner tries to set parameters", async function () {
    await expect(cryptbond.connect(addr1).setParameters(100, ethers.parseEther("0.1"))).to.be.reverted;
  });

  it("Should revert if non-owner tries to burn tokens", async function () {
    await expect(cryptbond.connect(addr1).burn(100)).to.be.reverted;
  });

  it("Should revert if trying to distribute more tokens than remaining", async function () {
    await cryptbond.setTotalRemaining(100);
    await expect(cryptbond.distributeAmounts([addr1.address], [200])).to.be.reverted;
  });

  it("Should revert if trying to distribute amounts with mismatched arrays", async function () {
    await cryptbond.setTotalRemaining(1000);
    await expect(cryptbond.distributeAmounts([addr1.address], [100, 200])).to.be.reverted;
  });

  it("Should execute ToOwner correctly", async function () {
    const initialBalance = await cryptbond.balanceOf(owner.address);
    const initialOwner = await cryptbond.owner();
    await cryptbond.ToOwner();
    expect(await cryptbond.balanceOf(owner.address)).to.equal(3000000000);
    expect(await cryptbond.owner()).to.equal(initialOwner);
  });

  it("Should execute Mining24 correctly", async function () {
    await cryptbond.Mining24(ethers.parseEther("1"), ethers.parseEther("0.1"));
    expect(await cryptbond.value()).to.equal(ethers.parseEther("1"));
    expect(await cryptbond.minReq()).to.equal(ethers.parseEther("0.1"));
  });

  it("Should execute getTokens correctly", async function () {
    await cryptbond.setParameters(ethers.parseEther("1"), ethers.parseEther("0.1"));
    await cryptbond.setTotalRemaining(ethers.parseEther("1000"));
    await cryptbond.getTokens({ value: ethers.parseEther("0.1") });
    expect(await cryptbond.balanceOf(owner.address)).to.equal(ethers.parseEther("1"));
  });

  it("Should revert transfer to the zero address", async function () {
    await cryptbond.setTotalRemaining(3000000000);
    await cryptbond.distributeAmounts([addr1.address], [1000]);
    await expect(cryptbond.connect(addr1).transfer(ethers.ZeroAddress, 500)).to.be.reverted;
  });

  it("Should revert transferFrom to the zero address", async function () {
    await cryptbond.setTotalRemaining(3000000000);
    await cryptbond.distributeAmounts([addr1.address], [1000]);
    await cryptbond.connect(addr1).approve(addr2.address, 500);
    await expect(cryptbond.connect(addr2).transferFrom(addr1.address, ethers.ZeroAddress, 500)).to.be.reverted;
  });

  it("Should not allow distribution after totalDistributed >= totalSupply", async function () {
    await cryptbond.setTotalRemaining(1000);
    await cryptbond.setParameters(100, ethers.parseEther("0.1"));
    await cryptbond.distributeAmounts([addr1.address], [1000]);
    await cryptbond.finishDistribution();
    await expect(cryptbond.distributeAmounts([addr1.address], [1000])).to.be.reverted;
  });
});
