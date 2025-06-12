const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Hexagon Contract", function () {
  let Hexagon, hexagon, owner, addr1, addr2;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    const HexagonFactory = await ethers.getContractFactory("Hexagon");
    hexagon = await HexagonFactory.deploy();
  });

  it("Should set the correct initial supply and assign it to the owner", async function () {
    const initialSupply = await hexagon.initialSupply();
    const ownerBalance = await hexagon.balanceOf(owner.address);
    expect(ownerBalance).to.equal(initialSupply);
  });

  it("Should transfer tokens between accounts", async function () {
    const transferAmount = 1000;
    await hexagon.transfer(addr1.address, transferAmount);
    const addr1Balance = await hexagon.balanceOf(addr1.address);
    expect(addr1Balance).to.equal(transferAmount);
  });

  it("Should fail if sender does not have enough balance", async function () {
    const transferAmount = 1000;
    await expect(
      hexagon.connect(addr1).transfer(addr2.address, transferAmount)
    ).to.be.reverted;
  });

  it("Should burn tokens and reduce total supply", async function () {
    const burnAmount = 1000n;
    const initialSupply = await hexagon.totalSupply();
    await hexagon.burn(burnAmount);
    const finalSupply = await hexagon.totalSupply();
    expect(finalSupply).to.equal(initialSupply - burnAmount);
  });

  it("Should approve and allow spending on behalf of the owner", async function () {
    const approveAmount = 5000;
    await hexagon.approve(addr1.address, approveAmount);
    const allowance = await hexagon.allowance(owner.address, addr1.address);
    expect(allowance).to.equal(approveAmount);
  });

  it("Should transfer tokens using transferFrom", async function () {
    const approveAmount = 5000;
    const transferAmount = 3000;

    await hexagon.approve(addr1.address, approveAmount);
    await hexagon.connect(addr1).transferFrom(owner.address, addr2.address, transferAmount);

    const addr2Balance = await hexagon.balanceOf(addr2.address);
    expect(addr2Balance).to.equal(transferAmount);

    const remainingAllowance = await hexagon.allowance(owner.address, addr1.address);
    expect(remainingAllowance).to.equal(approveAmount - transferAmount);
  });

  it("Should fail to transferFrom if allowance is insufficient", async function () {
    const transferAmount = 3000;
    await expect(
      hexagon.connect(addr1).transferFrom(owner.address, addr2.address, transferAmount)
    ).to.be.reverted;
  });

  it("Should apply burnPerTransaction fee during transfer", async function () {
    const transferAmount = 1000n;
    const burnPerTransaction = await hexagon.burnPerTransaction();

    await hexagon.transfer(addr1.address, transferAmount);

    const addr1Balance = await hexagon.balanceOf(addr1.address);
    expect(addr1Balance).to.equal(transferAmount);

    const ownerBalance = await hexagon.balanceOf(owner.address);
    const expectedOwnerBalance = (await hexagon.initialSupply()) - transferAmount - burnPerTransaction;
    expect(ownerBalance).to.equal(expectedOwnerBalance);

    const burnAddressBalance = await hexagon.balanceOf("0x0000000000000000000000000000000000000000");
    expect(burnAddressBalance).to.equal(burnPerTransaction);
  });
});
