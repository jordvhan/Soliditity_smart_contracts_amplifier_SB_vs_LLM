const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("HashnodeTestCoin", function () {
  let Token, token, owner, addr1, addr2;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    Token = await ethers.getContractFactory("HashnodeTestCoin");
    token = await Token.deploy();
  });

  it("Should assign the total supply of tokens to the owner", async function () {
    const ownerBalance = await token.balanceOf(owner.address);
    expect(ownerBalance).to.equal(await token.totalSupply());
  });

  it("Should transfer tokens between accounts", async function () {
    await token.transfer(addr1.address, 1000);
    expect(await token.balanceOf(addr1.address)).to.equal(1000);

    await token.connect(addr1).transfer(addr2.address, 500);
    expect(await token.balanceOf(addr2.address)).to.equal(500);
    expect(await token.balanceOf(addr1.address)).to.equal(500);
  });

  it("Should fail if sender doesn’t have enough tokens", async function () {
    const initialOwnerBalance = await token.balanceOf(owner.address);
    const initialAddr1Balance = await token.balanceOf(addr1.address);

    // Attempt to transfer tokens from addr1 to owner
    await expect(token.connect(addr1).transfer(owner.address, 1));

    // After the failed transfer, check that the balances remain unchanged
    const finalOwnerBalance = await token.balanceOf(owner.address);
    const finalAddr1Balance = await token.balanceOf(addr1.address);

    expect(finalOwnerBalance).to.equal(initialOwnerBalance);
    expect(finalAddr1Balance).to.equal(initialAddr1Balance);
  });

it("Should update balances after transfers", async function () {
  const initialOwnerBalance = await token.balanceOf(owner.address);

  // Transfer tokens
  await token.transfer(addr1.address, ethers.parseUnits("1000", 18));
  await token.transfer(addr2.address, ethers.parseUnits("2000", 18));

  const finalOwnerBalance = await token.balanceOf(owner.address);
  // Subtract using BigNumber's sub method
  expect(finalOwnerBalance).to.equal(initialOwnerBalance-ethers.parseUnits("3000", 18));

  const addr1Balance = await token.balanceOf(addr1.address);
  expect(addr1Balance).to.equal(ethers.parseUnits("1000", 18));

  const addr2Balance = await token.balanceOf(addr2.address);
  expect(addr2Balance).to.equal(ethers.parseUnits("2000", 18));
});


  it("Should approve and allow spending of tokens", async function () {
    await token.approve(addr1.address, 1000);
    expect(await token.allowance(owner.address, addr1.address)).to.equal(1000);

    await token.connect(addr1).transferFrom(owner.address, addr2.address, 500);
    expect(await token.balanceOf(addr2.address)).to.equal(500);
    expect(await token.allowance(owner.address, addr1.address)).to.equal(500);
  });

  it("Should fail transferFrom if allowance is insufficient", async function () {
    // Set up the initial balances
    const initialOwnerBalance = await token.balanceOf(owner.address);
    const initialAddr2Balance = await token.balanceOf(addr2.address);

    // Approve addr1 to spend 1000 tokens on behalf of owner
    await token.approve(addr1.address, 1000);

    // Attempt to transferFrom with an insufficient allowance
    await expect(
      token.connect(addr1).transferFrom(owner.address, addr2.address, 1500)
    );

    // After the failed transfer, check that the balances are unchanged
    const finalOwnerBalance = await token.balanceOf(owner.address);
    const finalAddr2Balance = await token.balanceOf(addr2.address);

    expect(finalOwnerBalance).to.equal(initialOwnerBalance);
    expect(finalAddr2Balance).to.equal(initialAddr2Balance);
  });
});
