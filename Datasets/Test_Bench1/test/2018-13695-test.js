const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CTest7 Contract", function () {
  let cTest7, owner, addr1, addr2, founder1, founder2, founder3;

  beforeEach(async function () {
    [owner, addr1, addr2, founder1, founder2, founder3] = await ethers.getSigners();
    const CTest7Factory = await ethers.getContractFactory("CTest7");
    cTest7 = await CTest7Factory.deploy();
  });

  it("Should have correct initial values", async function () {
    expect(await cTest7.name()).to.equal("CTest7 Token");
    expect(await cTest7.symbol()).to.equal("CTest7");
    expect(await cTest7.decimals()).to.equal(18);
    expect(await cTest7.totalSupply()).to.equal(0);
  });

  it("Should handle Ether transfers and update rates correctly", async function () {
    const value = ethers.parseEther("0.01");
    await addr1.sendTransaction({ to: cTest7.target, value });

    expect(await cTest7.balanceOf(addr1.address)).to.be.gt(0);
    expect(await cTest7.totalSupply()).to.be.gt(0);
  });

  it("Should revert Ether transfers exceeding supply or tier limits", async function () {
    const value = ethers.parseEther("1000");
    await expect(addr1.sendTransaction({ to: cTest7.target, value })).to.be.reverted;
  });

  it("Should revert transfers with insufficient balance", async function () {
    await expect(
      cTest7.connect(addr1).transfer(addr2.address, ethers.parseUnits("1", 18))
    ).to.be.reverted;
  });

  it("Should burn remaining tokens correctly", async function () {
    await cTest7.connect(owner).Burn();
    expect(await cTest7.totalSupply()).to.equal(ethers.parseUnits("0.000000000001", 18));
  });

  it("Should revert burn if not owner or supply is maxed", async function () {
    await expect(cTest7.connect(addr1).Burn()).to.be.reverted;
  });
});
