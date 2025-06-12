const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ERC20Token", function () {
  let ERC20Token, erc20Token, owner, addr1, addr2, addrs;

  beforeEach(async function () {
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();
    const ERC20TokenFactory = await ethers.getContractFactory("contracts/2018-11561.sol:ERC20Token");
    erc20Token = await ERC20TokenFactory.deploy();
  });

  it("Should assign the total supply of tokens to the owner", async function () {
    const ownerBalance = await erc20Token.balanceOf(owner.address);
    expect(ownerBalance).to.equal(await erc20Token.totalSupply());
  });

  it("Should transfer tokens between accounts", async function () {
    const transferAmount = ethers.parseEther("100");
    await erc20Token.transfer(addr1.address, transferAmount);
    const addr1Balance = await erc20Token.balanceOf(addr1.address);
    expect(addr1Balance).to.equal(transferAmount);
  });

  it("Should not fail but transfer should do nothing if sender doesn’t have enough tokens", async function () {
    const initialOwnerBalance = await erc20Token.balanceOf(owner.address);
    await expect(
      erc20Token.connect(addr1).transfer(owner.address, ethers.parseEther("1"))
    ).to.be.ok;
    expect(await erc20Token.balanceOf(owner.address)).to.equal(initialOwnerBalance);
  });

  it("Should update balances after transfers", async function () {
    const transferAmount = ethers.parseEther("50");
    await erc20Token.transfer(addr1.address, transferAmount);
    await erc20Token.connect(addr1).transfer(addr2.address, transferAmount);

    const addr2Balance = await erc20Token.balanceOf(addr2.address);
    expect(addr2Balance).to.equal(transferAmount);
  });

  it("Should approve tokens for delegated transfer", async function () {
    const approveAmount = ethers.parseEther("100");
    await erc20Token.approve(addr1.address, approveAmount);
    const allowance = await erc20Token.allowance(owner.address, addr1.address);
    expect(allowance).to.equal(approveAmount);
  });

  it("Should handle delegated token transfers", async function () {
    const transferAmount = ethers.parseEther("100");
    await erc20Token.approve(addr1.address, transferAmount);
    await erc20Token.connect(addr1).transferFrom(owner.address, addr2.address, transferAmount);

    const addr2Balance = await erc20Token.balanceOf(addr2.address);
    expect(addr2Balance).to.equal(transferAmount);
  });

  it("Should distribute tokens to multiple addresses", async function () {
    const distributeAmount = ethers.parseEther("10");
    const recipients = [addr1.address, addr2.address];
    await erc20Token.distributeToken(recipients, distributeAmount);

    for (const recipient of recipients) {
      const balance = await erc20Token.balanceOf(recipient);
      expect(balance).to.equal(distributeAmount);
    }
  });
});
