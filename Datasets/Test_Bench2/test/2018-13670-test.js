const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("GFCB Contract", function () {
    let GFCB, gfcb, owner, addr1, addr2;

    beforeEach(async function () {
        [owner, addr1, addr2, ...addrs] = await ethers.getSigners();
        const GFCBFactory = await ethers.getContractFactory("GFCB");
        gfcb = await GFCBFactory.deploy();
    });

    it("Should deploy with correct initial values", async function () {
        expect(await gfcb.name()).to.equal("Golden Fortune Coin Blocked");
        expect(await gfcb.symbol()).to.equal("GFCB");
        expect(await gfcb.decimals()).to.equal(18);
        expect(await gfcb.totalSupply()).to.equal(ethers.parseEther("10000000000"));
        expect(await gfcb.balanceOf(owner.address)).to.equal(ethers.parseEther("10000000000"));
    });

    it("Should allow owner to transfer ownership", async function () {
        await gfcb.transferOwnership(addr1.address);
        expect(await gfcb.owner()).to.equal(addr1.address);
    });

    it("Should allow token transfers", async function () {
        await gfcb.transfer(addr1.address, ethers.parseEther("100"));
        expect(await gfcb.balanceOf(addr1.address)).to.equal(ethers.parseEther("100"));
        expect(await gfcb.balanceOf(owner.address)).to.equal(ethers.parseEther("9999999900"));
    });

    it("Should allow owner to mint tokens", async function () {
        await gfcb.mintToken(addr1.address, ethers.parseEther("1000"));
        expect(await gfcb.totalSupply()).to.equal(ethers.parseEther("10000001000"));
        expect(await gfcb.balanceOf(addr1.address)).to.equal(ethers.parseEther("1000"));
    });

    it("Should allow owner to freeze and unfreeze accounts", async function () {
        await gfcb.freezeAccount(addr1.address, true);
        expect(await gfcb.frozenAccount(addr1.address)).to.equal(true);

        await expect(gfcb.connect(addr1).transfer(addr2.address, ethers.parseEther("10"))).to.be.reverted;

        await gfcb.freezeAccount(addr1.address, false);
        expect(await gfcb.frozenAccount(addr1.address)).to.equal(false);
    });

    it("Should allow owner to set buy and sell prices", async function () {
        await gfcb.setPrices(ethers.parseEther("0.01"), ethers.parseEther("0.02"));
        expect(await gfcb.sellPrice()).to.equal(ethers.parseEther("0.01"));
        expect(await gfcb.buyPrice()).to.equal(ethers.parseEther("0.02"));
    });

    it("Should prevent transfer to 0x0 address", async function () {
        await expect(gfcb.transfer("0x0000000000000000000000000000000000000000", ethers.parseEther("10"))).to.be.reverted;
    });

    it("Should revert transfer when balance is insufficient", async function () {
        await expect(gfcb.connect(addr1).transfer(addr2.address, ethers.parseEther("10"))).to.be.reverted;
    });

    it("Should prevent buying tokens when contract has insufficient balance", async function () {
        await gfcb.setPrices(ethers.parseEther("0.01"), ethers.parseEther("0.02"));
        await expect(gfcb.buy({ value: ethers.parseEther("1") })).to.be.reverted;
    });
});
