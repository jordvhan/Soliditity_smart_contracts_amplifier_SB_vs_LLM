const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Token Contract", function () {
  let Token, token, owner, controller, addr1, addr2, vault;

  beforeEach(async function () {
    [owner, controller, addr1, addr2, vault] = await ethers.getSigners();
    Token = await ethers.getContractFactory("contracts/2018-10706.sol:Token");
    token = await Token.deploy(
      1000, // initialSupply
      "TestToken", // tokenName
      18, // decimalUnits
      "TTK", // tokenSymbol
      vault.address // vaultAddress
    );
  });

  it("Should set the correct owner and initial supply", async function () {
    expect(await token.owner()).to.equal(owner.address);
    expect(await token.totalSupply()).to.equal(ethers.parseEther("1000"));
    expect(await token.balanceOf(owner.address)).to.equal(ethers.parseEther("1000"));
  });

  it("Should transfer tokens between accounts", async function () {
    await token.transfer(addr1.address, ethers.parseEther("100"));
    expect(await token.balanceOf(addr1.address)).to.equal(ethers.parseEther("100"));
    expect(await token.balanceOf(owner.address)).to.equal(ethers.parseEther("900"));
  });

  it("Should approve and allow spending of tokens", async function () {
    await token.approve(addr1.address, ethers.parseEther("50"));
    expect(await token.allowance(owner.address, addr1.address)).to.equal(ethers.parseEther("50"));

    await token.connect(addr1).transferFrom(owner.address, addr2.address, ethers.parseEther("50"));
    expect(await token.balanceOf(addr2.address)).to.equal(ethers.parseEther("50"));
    expect(await token.balanceOf(owner.address)).to.equal(ethers.parseEther("950"));
  });

it("Should freeze and unfreeze tokens", async function () {
  // Set the controller address
  await token.changeController(controller.address);

  // Ensure addr1 has sufficient balance
  const initialBalance = await token.balanceOf(addr1.address);
  const freezeAmount = 50;

  // Check if addr1 has enough balance to freeze
  if (initialBalance<freezeAmount) {
    await token.connect(controller).generateTokens(addr1.address, 100); // Generate some tokens for testing if necessary
  }

  // Freeze addr1's tokens
  await token.connect(controller).freeze(addr1.address, freezeAmount, 0);
  // on line 56 generate 100 tokens and freeze costs 50 so total is 100-50
  expect(await token.balanceOf(addr1.address)).to.equal(ethers.parseEther("50"));

  // Unfreeze addr1's tokens
  await token.connect(owner).unFreeze(0);
  expect(await token.balanceOf(addr1.address)).to.equal(ethers.parseEther(freezeAmount.toString())+ethers.parseEther("50"));
});


  it("Should generate and destroy tokens", async function () {
    await token.changeController(controller.address);

    await token.connect(controller).generateTokens(addr1.address, 100);
    expect(await token.balanceOf(addr1.address)).to.equal(ethers.parseEther("100"));

    await token.destroyTokens(addr1.address, 50);
    expect(await token.balanceOf(addr1.address)).to.equal(ethers.parseEther("50"));
  });

  it("Should change token parameters", async function () {
    await token.changeTokensPerEther(20000);
    expect(await token.tokensPerEther()).to.equal(20000);

    await token.changeAirdropQty(20);
    expect(await token.airdropQty()).to.equal(20);

    await token.changePaused(true);
    expect(await token.paused()).to.equal(true);
  });

  it("Should change ownership", async function () {
    await token.changeOwner(addr1.address);
    expect(await token.owner()).to.equal(addr1.address);
  });
});
