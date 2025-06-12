const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("FreeCoin Contract", function () {
    let FreeCoin, freeCoin, owner, addr1, addr2;

    beforeEach(async function () {
        [owner, addr1, addr2] = await ethers.getSigners();
        FreeCoin = await ethers.getContractFactory("FreeCoin");
        freeCoin = await FreeCoin.deploy(
            ethers.parseEther("1000"), // initial supply
            "FreeCoin",
            "FRC"
        );
    });

    it("Should deploy with correct initial supply", async function () {
        const totalSupply = await freeCoin.totalSupply();
        expect(totalSupply).to.equal(ethers.parseEther("1000000000000000000000"));
    });

    it("Should allow token transfers", async function () {
        await freeCoin.transfer(addr1.address, ethers.parseEther("100"));
        const balance = await freeCoin.balanceOf(addr1.address);
        expect(balance).to.equal(ethers.parseEther("100"));
    });

    it("Should allow minting of tokens by owner", async function () {
        await freeCoin.mintToken(addr1.address, ethers.parseEther("50"));
        const balance = await freeCoin.balanceOf(addr1.address);
        expect(balance).to.equal(ethers.parseEther("50"));
    });

    it("Should not allow minting by non-owner", async function () {
        await expect(
            freeCoin.connect(addr1).mintToken(addr1.address, ethers.parseEther("50"))
        ).to.be.reverted;
    });

    it("Should allow freezing and unfreezing of accounts", async function () {
        await freeCoin.freezeAccount(addr1.address, true);
        const isFrozen = await freeCoin.frozenAccount(addr1.address);
        expect(isFrozen).to.be.true;

        await freeCoin.freezeAccount(addr1.address, false);
        const isUnfrozen = await freeCoin.frozenAccount(addr1.address);
        expect(isUnfrozen).to.be.false;
    });

    it("Should allow setting buy and sell prices", async function () {
        await freeCoin.setPrices(ethers.parseEther("0.01"), ethers.parseEther("0.02"));
        const sellPrice = await freeCoin.sellPrice();
        const buyPrice = await freeCoin.buyPrice();
        expect(sellPrice).to.equal(ethers.parseEther("0.01"));
        expect(buyPrice).to.equal(ethers.parseEther("0.02"));
    });

    it("Should allow buying tokens", async function () {
        await freeCoin.setPrices(ethers.parseEther("0.01"), ethers.parseEther("0.02"));
        await freeCoin.buy({ value: ethers.parseEther("1") });
        const balance = await freeCoin.balanceOf(owner.address);
        expect(balance).to.equal(ethers.parseUnits("1000000000000000000000000000000000000050", 0)); // buying worth 1 ETH at 0.02 price gives 50
    });

    it("Should not allow selling tokens if contract lacks funds", async function () {
        await freeCoin.setPrices(ethers.parseEther("0.01"), ethers.parseEther("0.02"));
        await expect(
            freeCoin.sell(ethers.parseEther("1000"))
        ).to.be.reverted;
    });

    it("Should burn tokens correctly", async function () {
        await freeCoin.burn(ethers.parseEther("100000000000000000000"));
        const totalSupply = await freeCoin.totalSupply();
        expect(totalSupply).to.equal(ethers.parseEther("900000000000000000000"));
    });

    it("Should burn tokens from another account correctly", async function () {
        await freeCoin.transfer(addr1.address, ethers.parseEther("100000000000000000000"));
        await freeCoin.connect(addr1).approve(owner.address, ethers.parseEther("50000000000000000000"));
        await freeCoin.burnFrom(addr1.address, ethers.parseEther("50000000000000000000"));
        const balance = await freeCoin.balanceOf(addr1.address);
        expect(balance).to.equal(ethers.parseEther("50000000000000000000"));
    });
});
