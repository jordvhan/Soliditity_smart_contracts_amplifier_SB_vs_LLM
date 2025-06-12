const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("DimonCoin Contract", function () {
    let DimonCoin, dimonCoin, owner, addr1, addr2;

    beforeEach(async function () {
        [owner, addr1, addr2, ...addrs] = await ethers.getSigners();
        DimonCoin = await ethers.getContractFactory("DimonCoin");
        dimonCoin = await DimonCoin.deploy();
    });

    it("Should set the right owner", async function () {
        expect(await dimonCoin.owner()).to.equal(owner.address);
    });

    it("Should assign the total supply to the owner", async function () {
        const ownerBalance = await dimonCoin.balanceOf(owner.address);
        expect(ownerBalance).to.equal(await dimonCoin.totalSupply());
    });
it("Should transfer tokens between accounts", async function () {
  const transferAmount = ethers.parseEther("0.0001");  // Amount to transfer
  const initialBalanceSender = await dimonCoin.balanceOf(owner.address);
  const initialBalanceReceiver = await dimonCoin.balanceOf(addr1.address);

  // Transfer tokens
  const tx = await dimonCoin.transfer(addr1.address, transferAmount);

  // Wait for the transaction to be mined
  await tx.wait();

  const finalBalanceSender = await dimonCoin.balanceOf(owner.address);
  const finalBalanceReceiver = await dimonCoin.balanceOf(addr1.address);

  // Ensure balances have updated correctly
  expect(finalBalanceSender).to.equal(initialBalanceSender-transferAmount);
  expect(finalBalanceReceiver).to.equal(initialBalanceReceiver+transferAmount);
});



    it("Should fail if sender doesn’t have enough tokens", async function () {
      const initialOwnerBalance = await dimonCoin.balanceOf(owner.address);
      const result = await dimonCoin.connect(addr1).transfer(owner.address, ethers.parseEther("1"));
      expect(await dimonCoin.balanceOf(owner.address)).to.equal(initialOwnerBalance);
    });


    it("Should update balances after transfers", async function () {
        const transferAmount = ethers.parseEther("0.00005");
        await dimonCoin.transfer(addr1.address, transferAmount);
        await dimonCoin.connect(addr1).transfer(addr2.address, transferAmount);

        expect(await dimonCoin.balanceOf(addr2.address)).to.equal(transferAmount);
        expect(await dimonCoin.balanceOf(addr1.address)).to.equal(0);
    });

    it("Should allow owner to transfer ownership", async function () {
        await dimonCoin.transferOwnership(addr1.address);
        expect(await dimonCoin.owner()).to.equal(addr1.address);
    });

    it("Should distribute tokens based on ETH balance", async function () {
        const addresses = [addr1.address, addr2.address];
        const distributeAmount = ethers.parseEther("10");
        const ethBalanceThreshold = ethers.parseEther("1");

        await dimonCoin.distributeFUD(addresses, distributeAmount, ethBalanceThreshold);

        expect(await dimonCoin.balanceOf(addr1.address)).to.equal(distributeAmount);
        expect(await dimonCoin.balanceOf(addr2.address)).to.equal(distributeAmount);
    });
});
