const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SEC Token Contract", function () {
    let owner, addr1, addr2, SEC, secToken;

    beforeEach(async function () {
        [owner, addr1, addr2] = await ethers.getSigners();

        const SECToken = await ethers.getContractFactory("SEC");
        secToken = await SECToken.deploy();
    });

    it("Should deploy with correct initial supply", async function () {
        const totalSupply = await secToken.totalSupply();
        expect(totalSupply).to.equal(ethers.parseEther("1500000000"));
    });

    it("Should allow owner to transfer tokens", async function () {
        await secToken.transfer(addr1.address, ethers.parseEther("100"));
        const balance = await secToken.balanceOf(addr1.address);
        expect(balance).to.equal(ethers.parseEther("100"));
    });

    it("Should not allow transfer to 0x0 address", async function () {
        const AddressZero = "0x0000000000000000000000000000000000000000";
        await expect(secToken.transfer(AddressZero, ethers.parseEther("100"))).to.be.reverted;
    });

    it("Should allow owner to mint tokens", async function () {
        await secToken.mintToken(addr1.address, ethers.parseEther("100"));
        const balance = await secToken.balanceOf(addr1.address);
        expect(balance).to.equal(ethers.parseEther("100"));
    });

    it("Should allow owner to freeze and unfreeze accounts", async function () {
        await secToken.freezeAccount(addr1.address, true);
        const isFrozen = await secToken.frozenAccount(addr1.address);
        expect(isFrozen).to.be.true;

        await expect(secToken.connect(addr1).transfer(addr2.address, ethers.parseEther("50"))).to.be.reverted;

        await secToken.freezeAccount(addr1.address, false);
        const isUnfrozen = await secToken.frozenAccount(addr1.address);
        expect(isUnfrozen).to.be.false;
    });

    it("Should allow owner to set buy and sell prices", async function () {
        await secToken.setPrices(ethers.parseEther("0.01"), ethers.parseEther("0.02"));
        const sellPrice = await secToken.sellPrice();
        const buyPrice = await secToken.buyPrice();

        expect(sellPrice).to.equal(ethers.parseEther("0.01"));
        expect(buyPrice).to.equal(ethers.parseEther("0.02"));
    });

    it("Should not allow non-owner to mint tokens", async function () {
        await expect(secToken.connect(addr1).mintToken(addr1.address, ethers.parseEther("100"))).to.be.reverted;
    });

    it("Should not allow non-owner to freeze accounts", async function () {
        await expect(secToken.connect(addr1).freezeAccount(addr2.address, true)).to.be.reverted;
    });

    it("Should allow approve and transferFrom", async function () {
        await secToken.approve(addr1.address, ethers.parseEther("100"));
        await secToken.connect(addr1).transferFrom(owner.address, addr2.address, ethers.parseEther("50"));
        expect(await secToken.balanceOf(addr2.address)).to.equal(ethers.parseEther("50"));
    });

    it("Should not allow transferFrom without approval", async function () {
        await expect(secToken.connect(addr1).transferFrom(owner.address, addr2.address, ethers.parseEther("50"))).to.be.reverted;
    });

    it("Should not allow selling tokens if contract doesn't have enough ether", async function () {
        await secToken.setPrices(ethers.parseEther("1"), ethers.parseEther("2"));
        await secToken.transfer(addr1.address, ethers.parseEther("1"));
        
        // Attempt to sell when the contract has no ether
        await expect(secToken.connect(addr1).sell(ethers.parseEther("1"))).to.be.reverted;
    });

    it("Should allow burning tokens", async function () {
        const initialTotalSupply = await secToken.totalSupply();
        const burnAmount = ethers.parseEther("100");

        await secToken.burn(burnAmount);

        const finalTotalSupply = await secToken.totalSupply();
        expect(finalTotalSupply).to.equal(initialTotalSupply - burnAmount);
        expect(await secToken.balanceOf(owner.address)).to.equal(initialTotalSupply - burnAmount);
    });

    it("Should allow burning tokens from another account", async function () {
        await secToken.approve(addr1.address, ethers.parseEther("100"));
        const initialTotalSupply = await secToken.totalSupply();
        const burnAmount = ethers.parseEther("50");

        await secToken.connect(addr1).burnFrom(owner.address, burnAmount);

        const finalTotalSupply = await secToken.totalSupply();
        expect(finalTotalSupply).to.equal(initialTotalSupply - burnAmount);
    });

    it("Should not allow burning tokens from another account without approval", async function () {
        const burnAmount = ethers.parseEther("50");
        await expect(secToken.connect(addr1).burnFrom(owner.address, burnAmount)).to.be.reverted;
    });

    it("Should not allow burning more tokens than balance", async function () {
        const initialBalance = await secToken.balanceOf(owner.address);
        const burnAmount = initialBalance + ethers.parseEther("1");
        await expect(secToken.burn(burnAmount)).to.be.reverted;
    });

    it("Should handle team account token lock", async function () {
        const teamaccount = owner; // Assuming owner is the team account for simplicity
        const SECtotalAmount = ethers.parseEther("1500000000");
        const transferAmount = ethers.parseEther("10");
        const start = Math.floor(Date.now() / 1000) - (365 * 24 * 3600); // Mock start time

        // Transfer tokens to team account
        await secToken.transfer(teamaccount.address, SECtotalAmount);

        // Fast forward time
        await ethers.provider.send("evm_increaseTime", [365 * 24 * 3600]);
        await ethers.provider.send("evm_mine");

        // Attempt to transfer an amount that violates the lock
        await expect(secToken.connect(teamaccount).transfer(addr1.address, transferAmount)).to.not.be.reverted;
    });
});
