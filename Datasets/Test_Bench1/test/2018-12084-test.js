const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("BitAseanToken", function () {
  let owner, addr1, addr2, token;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    const BitAseanToken = await ethers.getContractFactory("BitAseanToken");
    token = await BitAseanToken.deploy(
      ethers.parseEther("1000"), // initialSupply
      "BitAsean",               // tokenName
      18,                       // decimalUnits
      "BAT"                     // tokenSymbol
    );
  });

  it("Should assign the initial supply to the owner", async function () {
    const ownerBalance = await token.balanceOf(owner.address);
    expect(ownerBalance).to.equal(ethers.parseEther("1000"));
  });

  it("Should transfer tokens between accounts", async function () {
    await token.transfer(addr1.address, ethers.parseEther("100"));
    const addr1Balance = await token.balanceOf(addr1.address);
    expect(addr1Balance).to.equal(ethers.parseEther("100"));
  });

  it("Should fail if sender doesn’t have enough tokens", async function () {
    await expect(
      token.connect(addr1).transfer(addr2.address, ethers.parseEther("1"))
    ).to.be.reverted;
  });

  it("Should allow owner to mint tokens", async function () {
    await token.mintToken(addr1.address, ethers.parseEther("500"));
    const addr1Balance = await token.balanceOf(addr1.address);
    expect(addr1Balance).to.equal(ethers.parseEther("500"));
  });

  it("Should freeze and unfreeze accounts", async function () {
    await token.freezeAccount(owner.address, true);
    await expect(
      token.connect(owner).transfer(addr2.address, ethers.parseEther("1"))
    ).to.be.reverted;

    await token.freezeAccount(owner.address, false);
    await token.connect(owner).transfer(addr2.address, ethers.parseEther("1"));
    const addr2Balance = await token.balanceOf(addr2.address);
    expect(addr2Balance).to.equal(ethers.parseEther("1"));
  });

  it("Should approve and allow transferFrom", async function () {
    await token.approve(addr1.address, ethers.parseEther("50"));
    const allowance = await token.allowance(owner.address, addr1.address);
    expect(allowance).to.equal(ethers.parseEther("50"));

    await token.connect(addr1).transferFrom(
      owner.address,
      addr2.address,
      ethers.parseEther("50")
    );
    const addr2Balance = await token.balanceOf(addr2.address);
    expect(addr2Balance).to.equal(ethers.parseEther("50"));
  });

  it("Should fail transferFrom if allowance is insufficient", async function () {
    await token.approve(addr1.address, ethers.parseEther("10"));
    await expect(
      token.connect(addr1).transferFrom(
        owner.address,
        addr2.address,
        ethers.parseEther("20")
      )
    ).to.be.reverted;
  });
});
