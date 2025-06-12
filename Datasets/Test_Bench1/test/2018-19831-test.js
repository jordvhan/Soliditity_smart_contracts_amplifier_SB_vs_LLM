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
    await cryptbond.setTotalRemaining(3000000000); // voeg deze regel toe
    await cryptbond.distributeAmounts([addr1.address], [1000]);
    expect(await cryptbond.balanceOf(addr1.address)).to.equal(1000);
  });

  it("Should allow token transfers", async function () {
    await cryptbond.setTotalRemaining(3000000000);
    await cryptbond.distributeAmounts([addr1.address], [1000]);
    await cryptbond.connect(addr1).transfer(addr2.address, 500);
    expect(await cryptbond.balanceOf(addr1.address)).to.equal(500);
    expect(await cryptbond.balanceOf(addr2.address)).to.equal(500);
  });

  it("Should allow token approvals and transfers via transferFrom", async function () {
    await cryptbond.setTotalRemaining(3000000000);
    await cryptbond.distributeAmounts([addr1.address], [1000]);
    await cryptbond.connect(addr1).approve(addr2.address, 500);
    expect(await cryptbond.allowance(addr1.address, addr2.address)).to.equal(500);

    await cryptbond.connect(addr2).transferFrom(addr1.address, addr2.address, 500);
    expect(await cryptbond.balanceOf(addr1.address)).to.equal(500);
    expect(await cryptbond.balanceOf(addr2.address)).to.equal(500);
  });

  it("Should allow the owner to burn tokens", async function () {
    await cryptbond.setTotalRemaining(3000000000);
    await cryptbond.distributeAmounts([owner.address], [1000]);
    await cryptbond.burn(500);
    expect(await cryptbond.balanceOf(owner.address)).to.equal(500);
    expect(await cryptbond.totalSupply()).to.equal(2999999500);
  });


  it("Should allow the owner to withdraw Ether", async function () {
    const initialBalance = await ethers.provider.getBalance(owner.address);

    // Stuur 1 ETH naar het contract
    await addr1.sendTransaction({
      to: cryptbond.target, // of cryptbond.address afhankelijk van ethers versie
      value: ethers.parseEther("1")
    });

    // Trek gasgebruik af door balans voor en na te vergelijken
    const tx = await cryptbond.withdraw();
    const receipt = await tx.wait();
    const gasUsed = receipt.gasUsed * receipt.gasPrice;

    const finalBalance = await ethers.provider.getBalance(owner.address);
    expect(finalBalance).to.be.gt(initialBalance-gasUsed);
  });

  it("Should enable and disable whitelist correctly", async function () {
    await cryptbond.enableWhitelist([addr1.address]);
    expect(await cryptbond.blacklist(addr1.address)).to.be.false;

    await cryptbond.disableWhitelist([addr1.address]);
    expect(await cryptbond.blacklist(addr1.address)).to.be.true;
  });

  it("Should handle airdrop correctly", async function () {
    // Stel de benodigde parameters in, inclusief het aantal beschikbare tokens
    await cryptbond.setParameters(100, ethers.parseEther("0.1"));
    await cryptbond.setTotalRemaining(ethers.parseEther("1000")); // Stel voldoende tokens in om de airdrop te dekken

    // Voer de airdrop uit
    await cryptbond.airdrop([addr1.address, addr2.address]);

    // Controleer de saldo's na de airdrop
    expect(await cryptbond.balanceOf(addr1.address)).to.equal(100);
    expect(await cryptbond.balanceOf(addr2.address)).to.equal(100);
  });

  it("Should distribute amounts correctly", async function () {
    // Stel de parameters in
    await cryptbond.setParameters(100, ethers.parseEther("0.1"));
    await cryptbond.setTotalRemaining(ethers.parseEther("1000")); // Zorg voor voldoende tokens

    // Verdeel de tokens
    await cryptbond.distributeAmounts([addr1.address, addr2.address], [100, 200]);

    // Controleer de distributie
    expect(await cryptbond.balanceOf(addr1.address)).to.equal(100);
    expect(await cryptbond.balanceOf(addr2.address)).to.equal(200);
  });


  it("Should revert if non-owner tries restricted functions", async function () {
    await expect(cryptbond.connect(addr1).setParameters(100, ethers.parseEther("0.1"))).to.be.revertedWithoutReason();
    await expect(cryptbond.connect(addr1).transferOwnership(addr2.address)).to.be.reverted;
  });
});
