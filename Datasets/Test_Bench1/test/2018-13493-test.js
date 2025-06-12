const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("DaddyToken Contract", function () {
    let DaddyToken, daddyToken, owner, addr1, addr2, addr3;

    beforeEach(async function () {
        [owner, addr1, addr2, addr3] = await ethers.getSigners();
        const initialSupply = ethers.parseEther("1000");
        DaddyToken = await ethers.getContractFactory("DaddyToken");
        daddyToken = await DaddyToken.deploy(initialSupply, "DaddyToken", "DTK");
    });

    it("Should initialize with correct values", async function () {
        expect(await daddyToken.name()).to.equal("DaddyToken");
        expect(await daddyToken.symbol()).to.equal("DTK");
        expect(await daddyToken.totalSupply()).to.equal(ethers.parseEther("1000000000000000000000"));
        expect(await daddyToken.balanceOf(owner.address)).to.equal(ethers.parseEther("1000000000000000000000"));
    });

    it("Should transfer tokens correctly", async function () {
        await daddyToken.transfer(addr1.address, ethers.parseEther("100000000000000000000"));
        expect(await daddyToken.balanceOf(addr1.address)).to.equal(ethers.parseEther("100000000000000000000"));
        expect(await daddyToken.balanceOf(owner.address)).to.equal(ethers.parseEther("900000000000000000000"));
    });

    it("Should allow owner to mint tokens", async function () {
        await daddyToken.mintToken(addr1.address, ethers.parseEther("50"));
        expect(await daddyToken.balanceOf(addr1.address)).to.equal(ethers.parseEther("50000000000000000000"));
        expect(await daddyToken.totalSupply()).to.equal(ethers.parseEther("1050000000000000000000"));
    });

    it("Should allow owner to freeze accounts", async function () {
        await daddyToken.freezeAccount(addr1.address, true);
        await expect(daddyToken.connect(addr1).transfer(addr2.address, ethers.parseEther("10"))).to.be.reverted;
    });

    it("Should allow owner to set prices", async function () {
        await daddyToken.setPrices(ethers.parseEther("0.01"), ethers.parseEther("0.02"));
        expect(await daddyToken.sellTokenPerEther()).to.equal(ethers.parseEther("0.01"));
        expect(await daddyToken.buyTokenPerEther()).to.equal(ethers.parseEther("0.02"));
    });

    it("Should distribute tokens correctly", async function () {
        const addresses = [addr1.address, addr2.address];
        await daddyToken.distributeToken(addresses, ethers.parseEther("10"));
        expect(await daddyToken.balanceOf(addr1.address)).to.equal(ethers.parseEther("10000000000000000000"));
        expect(await daddyToken.balanceOf(addr2.address)).to.equal(ethers.parseEther("10000000000000000000"));
    });

    it("Should burn tokens correctly", async function () {
        await daddyToken.burn(ethers.parseEther("100"));
        expect(await daddyToken.totalSupply()).to.equal(ethers.parseEther("900000000000000000000"));
        expect(await daddyToken.balanceOf(owner.address)).to.equal(ethers.parseEther("900000000000000000000"));
    });

    it("Should burn tokens from another account correctly", async function () {
        await daddyToken.transfer(addr1.address, ethers.parseEther("100000000000000000000"));
        await daddyToken.connect(addr1).approve(owner.address, ethers.parseEther("50000000000000000000"));
        await daddyToken.burnFrom(addr1.address, ethers.parseEther("50000000000000000000"));
        expect(await daddyToken.balanceOf(addr1.address)).to.equal(ethers.parseEther("50000000000000000000"));
        expect(await daddyToken.totalSupply()).to.equal(ethers.parseEther("950000000000000000000"));
    });
});
