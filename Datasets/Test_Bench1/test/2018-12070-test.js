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
});
