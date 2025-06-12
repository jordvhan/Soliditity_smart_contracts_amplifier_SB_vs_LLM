const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MoneyChainNetToken", function () {
    let owner, addr1, addr2, token;

    beforeEach(async function () {
        const Token = await ethers.getContractFactory("MoneyChainNetToken");
        [owner, addr1, addr2] = await ethers.getSigners();
        token = await Token.deploy();
    });

    it("Should deploy with correct initial supply", async function () {
        const initialSupply = 35_000_000n * 10n ** 8n;
        expect(await token.totalSupply()).to.equal(initialSupply);
        expect(await token.balanceOf(owner.address)).to.equal(initialSupply);
    });


    it("Should transfer tokens between accounts", async function () {
        const transferAmount = 1000n;
        await token.transfer(addr1.address, transferAmount);
        expect(await token.balanceOf(addr1.address)).to.equal(transferAmount);
        const remainingBalance = await token.totalSupply() - transferAmount;
        expect(await token.balanceOf(owner.address)).to.equal(remainingBalance);
    });


    it("Should fail transfer if sender has insufficient balance", async function () {
        await expect(token.connect(addr1).transfer(addr2.address, 1000)).to.be.reverted;
    });

    it("Should allow owner to mint tokens", async function () {
        const mintAmount = 5000n;
        const initialSupply = await token.totalSupply();
        await token.mintToken(addr1.address, mintAmount);
        expect(await token.balanceOf(addr1.address)).to.equal(mintAmount);
        expect(await token.totalSupply()).to.equal(initialSupply + mintAmount);
    });


    it("Should freeze and unfreeze accounts", async function () {
        await token.freezeAccount(addr1.address, true);
        await expect(token.connect(addr1).transfer(addr2.address, 1000)).to.be.reverted;
        await token.freezeAccount(addr1.address, false);
        await token.transfer(addr1.address, 1000);
        await token.connect(addr1).transfer(addr2.address, 500);
        expect(await token.balanceOf(addr2.address)).to.equal(500);
    });

    it("Should set buy and sell prices", async function () {
        const buyPrice = ethers.parseEther("0.01");
        const sellPrice = ethers.parseEther("0.005");
        await token.setPrices(sellPrice, buyPrice);
        expect(await token.buyPrice()).to.equal(buyPrice);
        expect(await token.sellPrice()).to.equal(sellPrice);
    });

    it("Should prevent buying if contract has insufficient tokens", async function () {
        const buyPrice = ethers.parseEther("0.01");
        await token.setPrices(0, buyPrice);
        await expect(token.connect(addr1).buy({ value: ethers.parseEther("1") })).to.be.reverted;
    });

    it("Should prevent selling if sender has insufficient tokens", async function () {
        const sellPrice = ethers.parseEther("0.005");
        await token.setPrices(sellPrice, 0);
        await expect(token.connect(addr1).sell(1000)).to.be.reverted;
    });
});
