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

    it("Should handle transfer to self", async function () {
        await freeCoin.transfer(owner.address, ethers.parseEther("0"));
        expect(await freeCoin.balanceOf(owner.address)).to.equal(ethers.parseEther("1000000000000000000000"));
    });

    it("Should handle transfer of zero tokens", async function () {
        await freeCoin.transfer(addr1.address, ethers.parseEther("0"));
        expect(await freeCoin.balanceOf(addr1.address)).to.equal(ethers.parseEther("0"));
    });

    it("Should not allow transfer to the zero address", async function () {
        await expect(freeCoin.transfer("0x0000000000000000000000000000000000000000", ethers.parseEther("10"))).to.be.reverted;
    });

    it("Should handle transferFrom with insufficient allowance", async function () {
        await freeCoin.approve(addr1.address, ethers.parseEther("50"));
        await expect(freeCoin.connect(addr1).transferFrom(owner.address, addr2.address, ethers.parseEther("100"))).to.be.reverted;
    });

    it("Should handle transferFrom with sufficient allowance", async function () {
        await freeCoin.approve(addr1.address, ethers.parseEther("100"));
        await freeCoin.connect(addr1).transferFrom(owner.address, addr2.address, ethers.parseEther("50"));
        expect(await freeCoin.balanceOf(addr2.address)).to.equal(ethers.parseEther("50"));
    });

    it("Should handle burn of zero tokens", async function () {
        await freeCoin.burn(ethers.parseEther("0"));
        expect(await freeCoin.totalSupply()).to.equal(ethers.parseEther("1000000000000000000000"));
    });

    it("Should handle burnFrom of zero tokens", async function () {
        await freeCoin.transfer(addr1.address, ethers.parseEther("100"));
        await freeCoin.connect(addr1).approve(owner.address, ethers.parseEther("100"));
        await freeCoin.burnFrom(addr1.address, ethers.parseEther("0"));
        expect(await freeCoin.balanceOf(addr1.address)).to.equal(ethers.parseEther("100"));
    });

    it("Should not allow burnFrom with insufficient allowance", async function () {
        await freeCoin.transfer(addr1.address, ethers.parseEther("100"));
        await freeCoin.connect(addr1).approve(owner.address, ethers.parseEther("50"));
        await expect(freeCoin.burnFrom(addr1.address, ethers.parseEther("100"))).to.be.reverted;
    });

    it("Should allow changing the free amount", async function () {
        await freeCoin.changeFree(ethers.parseEther("200"));
        //const freeAmount = await freeCoin.free();
        //expect(freeAmount).to.equal(ethers.parseEther("200"));
        const balance = await freeCoin.balanceOf(addr1.address);
        expect(balance).to.equal(ethers.parseEther("200"));
    });

    it("Should handle buying with zero value", async function () {
        await freeCoin.setPrices(ethers.parseEther("0.01"), ethers.parseEther("0.02"));
        await freeCoin.buy({ value: ethers.parseEther("0") });
        expect(await freeCoin.balanceOf(owner.address)).to.equal(ethers.parseEther("1000000000000000000000"));
    });

    it("Should not allow selling tokens if frozen", async function () {
        await freeCoin.setPrices(ethers.parseEther("0.01"), ethers.parseEther("0.02"));
        await freeCoin.freezeAccount(owner.address, true);
        await expect(freeCoin.sell(ethers.parseEther("100"))).to.be.reverted;
    });
});
