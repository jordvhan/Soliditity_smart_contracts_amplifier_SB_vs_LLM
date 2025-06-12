const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("DimonCoin Contract", function () {
    let DimonCoin, dimonCoin, owner, addr1, addr2, addrs;

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
        expect(finalBalanceSender).to.equal(initialBalanceSender - transferAmount);
        expect(finalBalanceReceiver).to.equal(initialBalanceReceiver + transferAmount);
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

    it("Should approve tokens for spending", async function () {
        const approveAmount = ethers.parseEther("0.0001");

        // Approve addr1 to spend tokens on behalf of owner
        await dimonCoin.approve(addr1.address, approveAmount);

        const allowance = await dimonCoin.allowance(owner.address, addr1.address);
        expect(allowance).to.equal(approveAmount);
    });

    it("Should return correct allowance", async function () {
        const approveAmount = ethers.parseEther("0.0001");
        await dimonCoin.approve(addr1.address, approveAmount);
        const allowance = await dimonCoin.allowance(owner.address, addr1.address);
        expect(allowance).to.equal(approveAmount);
    });

    it("Should return the correct name", async function () {
        expect(await dimonCoin.name()).to.equal("DimonCoin");
    });

    it("Should return the correct symbol", async function () {
        expect(await dimonCoin.symbol()).to.equal("FUD");
    });

    it("Should return the correct decimals", async function () {
        expect(await dimonCoin.decimals()).to.equal(8);
    });

    it("Should fail if distributeFUD is called by non-owner", async function () {
        const addresses = [addr1.address, addr2.address];
        const distributeAmount = ethers.parseEther("10");
        const ethBalanceThreshold = ethers.parseEther("1");

        await expect(dimonCoin.connect(addr1).distributeFUD(addresses, distributeAmount, ethBalanceThreshold))
            .to.be.reverted;
    });
});
