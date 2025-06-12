const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Crowdnext Contract", function () {
    let owner, addr1, addr2, Crowdnext, crowdnext;

    beforeEach(async function () {
        [owner, addr1, addr2] = await ethers.getSigners();
        const Token = await ethers.getContractFactory("Crowdnext");
        crowdnext = await Token.deploy();
    });

    it("Should deploy with correct initial supply", async function () {
        const initialSupply = await crowdnext.totalSupply();
        expect(initialSupply).to.equal(ethers.parseEther("0.000001"));
    });

    it("Should transfer tokens between accounts", async function () {
        await crowdnext.transfer(addr1.address, ethers.parseEther("0.000000000001"));
        expect(await crowdnext.balanceOf(addr1.address)).to.equal(ethers.parseEther("0.000000000001"));
    });

    it("Should not allow transfer if sender has insufficient balance", async function () {
        await expect(crowdnext.connect(addr1).transfer(addr2.address, ethers.parseEther("100"))).to.be.reverted;
    });

    it("Should allow owner to mint tokens", async function () {
        await crowdnext.mintToken(addr1.address, ethers.parseEther("1000"));
        expect(await crowdnext.balanceOf(addr1.address)).to.equal(ethers.parseEther("1000"));
    });

    it("Should freeze and unfreeze accounts", async function () {
        await crowdnext.freezeAccount(addr1.address, true);
        await expect(crowdnext.connect(addr1).transfer(addr2.address, ethers.parseEther("0.000000000001"))).to.be.reverted;

        await crowdnext.freezeAccount(addr1.address, false);
        await crowdnext.transfer(addr1.address, ethers.parseEther("0.000000000001"));
        await crowdnext.connect(addr1).transfer(addr2.address, ethers.parseEther("0.0000000000005"));
        expect(await crowdnext.balanceOf(addr2.address)).to.equal(ethers.parseEther("0.0000000000005"));
    });

    it("Should allow owner to set buy and sell prices", async function () {
        await crowdnext.setPrices(ethers.parseEther("0.01"), ethers.parseEther("0.02"));
        expect(await crowdnext.sellPrice()).to.equal(ethers.parseEther("0.01"));
        expect(await crowdnext.buyPrice()).to.equal(ethers.parseEther("0.02"));
    });

    it("Should prevent buying if contract has insufficient tokens", async function () {
        await crowdnext.setPrices(ethers.parseEther("0.01"), ethers.parseEther("0.02"));
        await expect(crowdnext.connect(addr1).buy({ value: ethers.parseEther("1") })).to.be.reverted;
    });

    it("Should prevent selling if user has insufficient tokens", async function () {
        await crowdnext.setPrices(ethers.parseEther("0.01"), ethers.parseEther("0.02"));
        await expect(crowdnext.connect(addr1).sell(ethers.parseEther("50"))).to.be.reverted;
    });
});
