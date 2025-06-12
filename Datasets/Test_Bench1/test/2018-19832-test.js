const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("NewIntelTechMedia Contract", function () {
  let owner, addr1, addr2, addr3, contract;

  beforeEach(async function () {
    [owner, addr1, addr2, addr3] = await ethers.getSigners();
    const Contract = await ethers.getContractFactory("NewIntelTechMedia");
    contract = await Contract.deploy();

    await contract.NETM();
  });

  it("Should deploy with correct initial values", async function () {
    expect(await contract.name()).to.equal("NewIntelTechMedia");
    expect(await contract.symbol()).to.equal("NETM");
    expect(await contract.decimals()).to.equal(18);
    expect(await contract.connect(owner).totalSupply()).to.equal(ethers.parseEther("500000000"));
    expect(await contract.connect(owner).totalDistributed()).to.equal(ethers.parseEther("250000000"));
  });

  it("Should allow owner to transfer ownership", async function () {
    await contract.transferOwnership(addr1.address);
    expect(await contract.owner()).to.equal(addr1.address);
  });

  it("Should distribute tokens correctly", async function () {
    await contract.getTokens({ value: ethers.parseEther("0") });
    expect(await contract.balanceOf(owner.address)).to.equal(ethers.parseEther("250002500"));
  });

  it("Should allow token transfers", async function () {
    await contract.connect(owner).transfer(addr1.address, ethers.parseEther("100"));
    expect(await contract.connect(addr1).balanceOf(addr1.address)).to.equal(ethers.parseEther("100"));
    expect(await contract.balanceOf(owner.address)).to.equal(ethers.parseEther("249999900"));
  });

  it("Should allow approvals and transfers via transferFrom", async function () {
    await contract.approve(addr1.address, ethers.parseEther("50"));
    expect(await contract.allowance(owner.address, addr1.address)).to.equal(ethers.parseEther("50"));

    await contract.connect(addr1).transferFrom(owner.address, addr2.address, ethers.parseEther("50"));
    expect(await contract.balanceOf(addr2.address)).to.equal(ethers.parseEther("50"));
    expect(await contract.balanceOf(owner.address)).to.equal(ethers.parseEther("249999950"));
  });

  it("Should allow burning tokens", async function () {
    await contract.burn(ethers.parseEther("100"));
    expect(await contract.totalSupply()).to.equal(ethers.parseEther("499999900"));
    expect(await contract.balanceOf(owner.address)).to.equal(ethers.parseEther("249999900"));
  });

  it("Should prevent blacklisted addresses from getting tokens", async function () {
    await contract.connect(addr1).getTokens({ value: ethers.parseEther("0") }); // eerste keer: whitelist
    await expect(contract.connect(addr1).getTokens({ value: ethers.parseEther("0") })).to.be.reverted; // tweede keer: blacklist
  });
});
