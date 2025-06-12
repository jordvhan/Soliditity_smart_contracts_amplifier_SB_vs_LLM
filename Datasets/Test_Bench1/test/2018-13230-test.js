const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("DestiNeedToken", function () {
    let owner, addr1, addr2, token;

    beforeEach(async function () {
        [owner, addr1, addr2] = await ethers.getSigners();

        const Token = await ethers.getContractFactory("DestiNeedToken");
        token = await Token.deploy();
    });

    it("Should deploy with correct initial supply", async function () {
        const initialSupply = ethers.parseEther("950000000");
        expect(await token.totalSupply()).to.equal(initialSupply);
        expect(await token.balanceOf(owner.address)).to.equal(initialSupply);
    });

    it("Should transfer tokens between accounts", async function () {
        const transferAmount = ethers.parseEther("100");
        await token.transfer(addr1.address, transferAmount);
        expect(await token.balanceOf(addr1.address)).to.equal(transferAmount);
        expect(await token.balanceOf(owner.address)).to.equal(
            (await token.totalSupply())-transferAmount
        );
    });

    it("Should not allow transfer if sender has insufficient balance", async function () {
        const transferAmount = ethers.parseEther("100");
        await expect(
            token.connect(addr1).transfer(addr2.address, transferAmount)
        ).to.be.reverted;
    });

    it("Should mint new tokens", async function () {
        const mintAmount = ethers.parseEther("500");
        const oldTotalSupply = await token.totalSupply();
        await token.mintToken(addr1.address, mintAmount);
        expect(await token.balanceOf(addr1.address)).to.equal(mintAmount);
        expect(await token.totalSupply()).to.equal(
            (oldTotalSupply)+mintAmount
        );
    });

    it("Should freeze and unfreeze accounts", async function () {
        await token.freezeAccount(addr1.address, true);
        expect(await token.frozenAccount(addr1.address)).to.be.true;

        await expect(
            token.connect(addr1).transfer(addr2.address, ethers.parseEther("10"))
        ).to.be.reverted;

        await token.freezeAccount(addr1.address, false);
        expect(await token.frozenAccount(addr1.address)).to.be.false;
    });

    it("Should set buy and sell prices", async function () {
        const buyPrice = ethers.parseEther("0.01");
        const sellPrice = ethers.parseEther("0.005");

        await token.setPrices(sellPrice, buyPrice);
        expect(await token.sellPrice()).to.equal(sellPrice);
        expect(await token.buyPrice()).to.equal(buyPrice);
    });

    it("Should prevent buying if contract has insufficient tokens", async function () {
        const buyPrice = ethers.parseEther("0.01");
        await token.setPrices(0, buyPrice);

        await expect(
            token.connect(addr1).buy({ value: ethers.parseEther("0.01") })
        ).to.be.reverted;
    });

    it("Should prevent selling if user has insufficient tokens", async function () {
        const sellPrice = ethers.parseEther("0.005");
        await token.setPrices(sellPrice, 0);

        await expect(
            token.connect(addr1).sell(ethers.parseEther("1"))
        ).to.be.reverted;
    });
});
