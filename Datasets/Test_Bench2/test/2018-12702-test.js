const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("GVE Contract", function () {
  let GVE, gve, owner, addr1, addr2;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    const GVEFactory = await ethers.getContractFactory("GVE");
    gve = await GVEFactory.deploy();
  });

  it("Should deploy with the correct total supply assigned to the founder", async function () {
    const totalSupply = await gve.totalSupply();
    const founderBalance = await gve.balanceOf(owner.address);
    expect(totalSupply).to.equal(founderBalance);
  });

  it("Should allow token transfers between accounts", async function () {
    const transferAmount = ethers.parseEther("100");
    await gve.transfer(addr1.address, transferAmount);
    const addr1Balance = await gve.balanceOf(addr1.address);
    expect(addr1Balance).to.equal(transferAmount);
  });

  it("Should emit a Transfer event on token transfer", async function () {
    const transferAmount = ethers.parseEther("50");
    await expect(gve.transfer(addr1.address, transferAmount))
      .to.emit(gve, "Transfer")
      .withArgs(owner.address, addr1.address, transferAmount);
  });

  it("Should not allow transfers exceeding the sender's balance", async function () {
    const transferAmount = ethers.parseEther("1000000001"); // Exceeds total supply
    await expect(gve.transfer(addr1.address, transferAmount)).to.be.reverted;
  });

  it("Should allow approvals and check allowances", async function () {
    const approveAmount = ethers.parseEther("200");
    await gve.approve(addr1.address, approveAmount);
    const allowance = await gve.allowance(owner.address, addr1.address);
    expect(allowance).to.equal(approveAmount);
  });

  it("Should emit an Approval event on approval", async function () {
    const approveAmount = ethers.parseEther("150");
    await expect(gve.approve(addr1.address, approveAmount))
      .to.emit(gve, "Approval")
      .withArgs(owner.address, addr1.address, approveAmount);
  });

  it("Should allow transferFrom when approved", async function () {
    const approveAmount = ethers.parseEther("300");
    const transferAmount = ethers.parseEther("100");
    await gve.approve(addr1.address, approveAmount);
    await gve.connect(addr1).transferFrom(owner.address, addr2.address, transferAmount);
    const addr2Balance = await gve.balanceOf(addr2.address);
    expect(addr2Balance).to.equal(transferAmount);
  });

  it("Should not allow transferFrom exceeding allowance", async function () {
    const approveAmount = ethers.parseEther("50");
    const transferAmount = ethers.parseEther("100");
    await gve.approve(addr1.address, approveAmount);
    await expect(
      gve.connect(addr1).transferFrom(owner.address, addr2.address, transferAmount)
    ).to.be.reverted;
  });


  it("Should fail if transfer to address(0)", async function () {
    await expect(
      gve.transfer(ethers.ZeroAddress, ethers.parseEther("100"))
    ).to.be.reverted;
  });

  it("Should fail if transferFrom to address(0)", async function () {
    await gve.approve(addr1.address, ethers.parseEther("100"));
    await expect(
      gve
        .connect(addr1)
        .transferFrom(owner.address, ethers.ZeroAddress, ethers.parseEther("100"))
    ).to.be.reverted;
  });

  it("Should return the correct token name", async function () {
    expect(await gve.name()).to.equal("Globalvillage ecosystem");
  });

  it("Should return the correct token symbol", async function () {
    expect(await gve.symbol()).to.equal("GVE");
  });

  it("Should return the correct token decimals", async function () {
    expect(await gve.decimals()).to.equal(18);
  });

  it("Should return the correct token version", async function () {
    expect(await gve.version()).to.equal("v0.1");
  });

  it("Should revert when receiving ether", async function () {
    await expect(
      addr1.sendTransaction({
        to: gve.target,
        value: ethers.parseEther("1.0"),
      })
    ).to.be.reverted;
  });
});
