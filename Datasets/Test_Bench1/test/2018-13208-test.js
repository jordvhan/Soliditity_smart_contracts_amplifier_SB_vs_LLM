const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MoneyTreeToken", function () {
    let moneyTreeToken, owner, addr1, addr2;

    beforeEach(async function () {
        [owner, addr1, addr2] = await ethers.getSigners();
        const MoneyTreeToken = await ethers.getContractFactory("MoneyTreeToken");
        moneyTreeToken = await MoneyTreeToken.deploy();
        await moneyTreeToken.waitForDeployment();
    });

    it("Should deploy with correct initial supply", async function () {
        const initialSupply = ethers.parseUnits("95000000", 8);
        const totalSupply = await moneyTreeToken.totalSupply();
        expect(totalSupply).to.equal(initialSupply);
        const ownerBalance = await moneyTreeToken.balanceOf(owner.address);
        expect(ownerBalance).to.equal(initialSupply);
    });

    it("Should transfer tokens between accounts", async function () {
        const transferAmount = 1000n;
        await moneyTreeToken.transfer(addr1.address, transferAmount);
        expect(await moneyTreeToken.balanceOf(addr1.address)).to.equal(transferAmount);

        const totalSupply = await moneyTreeToken.totalSupply();
        const expectedBalance = totalSupply - transferAmount;
        expect(await moneyTreeToken.balanceOf(owner.address)).to.equal(expectedBalance);
    });

    it("Should fail transfer if sender has insufficient balance", async function () {
        const transferAmount = 1000n;
        await expect(moneyTreeToken.connect(addr1).transfer(addr2.address, transferAmount)).to.be.reverted;
    });

    it("Should allow owner to mint tokens", async function () {
        const mintAmount = 5000n;
        const totalBefore = await moneyTreeToken.totalSupply();
        await moneyTreeToken.mintToken(addr1.address, mintAmount);
        expect(await moneyTreeToken.balanceOf(addr1.address)).to.equal(mintAmount);
        expect(await moneyTreeToken.totalSupply()).to.equal(totalBefore + mintAmount);
    });

    it("Should freeze and unfreeze accounts", async function () {
        await moneyTreeToken.freezeAccount(addr1.address, true);
        expect(await moneyTreeToken.frozenAccount(addr1.address)).to.be.true;

        await expect(moneyTreeToken.connect(addr1).transfer(addr2.address, 1000)).to.be.reverted;

        await moneyTreeToken.freezeAccount(addr1.address, false);
        expect(await moneyTreeToken.frozenAccount(addr1.address)).to.be.false;
    });

    it("Should set buy and sell prices", async function () {
        const buyPrice = ethers.parseEther("0.01");
        const sellPrice = ethers.parseEther("0.005");
        await moneyTreeToken.setPrices(sellPrice, buyPrice);
        expect(await moneyTreeToken.buyPrice()).to.equal(buyPrice);
        expect(await moneyTreeToken.sellPrice()).to.equal(sellPrice);
    });

    it("Should allow buying tokens", async function () {
        const buyPrice = ethers.parseEther("0.01");
        await moneyTreeToken.setPrices(0, buyPrice);

        const buyAmount = ethers.parseEther("1");
        const expectedTokens = buyAmount / buyPrice;

        // Fund the contract
        await moneyTreeToken.transfer(await moneyTreeToken.getAddress(), expectedTokens);

        await moneyTreeToken.connect(addr1).buy({ value: buyAmount });

        expect(await moneyTreeToken.balanceOf(addr1.address)).to.equal(expectedTokens);
    });

    it("Should prevent buying if contract lacks tokens", async function () {
        const buyPrice = ethers.parseEther("0.01");
        await moneyTreeToken.setPrices(0, buyPrice);

        const buyAmount = ethers.parseEther("1");
        await expect(moneyTreeToken.connect(addr1).buy({ value: buyAmount })).to.be.reverted;
    });

    it("Should prevent selling if sender lacks tokens", async function () {
        const sellPrice = ethers.parseEther("0.005");
        await moneyTreeToken.setPrices(sellPrice, 0);

        const sellAmount = 1000n;
        await expect(moneyTreeToken.connect(addr1).sell(sellAmount)).to.be.reverted;
    });
});
