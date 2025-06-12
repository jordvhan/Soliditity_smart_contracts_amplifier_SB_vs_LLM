const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MyAdvancedToken", function () {
    let Token, token, owner, addr1, addr2;

    beforeEach(async function () {
        [owner, addr1, addr2] = await ethers.getSigners();
        Token = await ethers.getContractFactory("contracts/2018-12081.sol:MyAdvancedToken");
        token = await Token.deploy(
            ethers.parseEther("1000"), // initialSupply
            "TestToken",              // tokenName
            18,                       // decimalUnits
            "TTK"                     // tokenSymbol
        );
        // Mint tokens to the contract itself to enable buying
        await token.mintToken(token.target, ethers.parseEther("500"));
        await token.setPrices(ethers.parseEther("0.001"), ethers.parseEther("0.001"));
    });

    it("Should deploy with correct initial values", async function () {
        expect(await token.name()).to.equal("TestToken");
        expect(await token.symbol()).to.equal("TTK");
        expect(await token.decimals()).to.equal(18);
        expect(await token.totalSupply()).to.equal(ethers.parseEther("1500"));
        expect(await token.balanceOf(owner.address)).to.equal(ethers.parseEther("1000"));
    });

    it("Should transfer tokens between accounts", async function () {
        await token.transfer(addr1.address, ethers.parseEther("100"));
        expect(await token.balanceOf(owner.address)).to.equal(ethers.parseEther("900"));
        expect(await token.balanceOf(addr1.address)).to.equal(ethers.parseEther("100"));
    });

    it("Should fail if sender does not have enough tokens", async function () {
        await expect(
            token.connect(addr1).transfer(addr2.address, ethers.parseEther("1"))
        ).to.be.reverted;
    });

    it("Should allow owner to mint tokens", async function () {
        await token.mintToken(addr1.address, ethers.parseEther("500"));
        expect(await token.totalSupply()).to.equal(ethers.parseEther("2000"));
        expect(await token.balanceOf(addr1.address)).to.equal(ethers.parseEther("500"));
    });

    it("Should allow owner to freeze and unfreeze accounts", async function () {
        await token.freezeAccount(owner.address, true);
        await expect(
            token.connect(owner).transfer(addr2.address, ethers.parseEther("1"))
        ).to.be.reverted;

        await token.freezeAccount(owner.address, false);
        await token.connect(owner).transfer(addr2.address, ethers.parseEther("1"));
        expect(await token.balanceOf(addr2.address)).to.equal(ethers.parseEther("1"));
    });

    it("Should allow setting prices", async function () {
        await token.setPrices(ethers.parseEther("0.01"), ethers.parseEther("0.02"));
        expect(await token.sellPrice()).to.equal(ethers.parseEther("0.01"));
        expect(await token.buyPrice()).to.equal(ethers.parseEther("0.02"));
    });

    it("Should prevent transferFrom with insufficient allowance", async function () {
        await token.approve(addr1.address, ethers.parseEther("50"));
        await expect(token.connect(addr1).transferFrom(owner.address, addr2.address, ethers.parseEther("100"))).to.be.reverted;
    });

    it("Should allow transferFrom with sufficient allowance", async function () {
        await token.approve(addr1.address, ethers.parseEther("100"));
        await token.connect(addr1).transferFrom(owner.address, addr2.address, ethers.parseEther("50"));
        expect(await token.balanceOf(addr2.address)).to.equal(ethers.parseEther("50"));
    });

    it("Should prevent minting tokens from non-owner", async function () {
        await expect(token.connect(addr1).mintToken(addr2.address, ethers.parseEther("100"))).to.be.reverted;
    });

    it("Should prevent freezing accounts from non-owner", async function () {
        await expect(token.connect(addr1).freezeAccount(addr2.address, true)).to.be.reverted;
    });

    it("Should prevent setting prices from non-owner", async function () {
        await expect(token.connect(addr1).setPrices(ethers.parseEther("0.01"), ethers.parseEther("0.02"))).to.be.reverted;
    });

    it("Should prevent selling tokens if user does not have enough tokens", async function () {
        await expect(token.connect(addr1).sell(ethers.parseEther("1000"))).to.be.reverted;
    });


    it("Should allow transfer of zero tokens", async function () {
        await token.transfer(addr1.address, 0);
        expect(await token.balanceOf(addr1.address)).to.equal(ethers.parseEther("0"));
    });

    it("Should allow transferFrom of zero tokens", async function () {
        await token.approve(addr1.address, 0);
        await token.connect(addr1).transferFrom(owner.address, addr2.address, 0);
        expect(await token.balanceOf(addr2.address)).to.equal(ethers.parseEther("0"));
    });

    it("Should allow setting same prices", async function () {
        const currentSellPrice = await token.sellPrice();
        const currentBuyPrice = await token.buyPrice();
        await token.setPrices(currentSellPrice, currentBuyPrice);
        expect(await token.sellPrice()).to.equal(currentSellPrice);
        expect(await token.buyPrice()).to.equal(currentBuyPrice);
    });

    it("Should allow buying zero amount of tokens", async function () {
        const initialBalance = await token.balanceOf(owner.address);
        await token.buy({ value: 0 });
        expect(await token.balanceOf(owner.address)).to.equal(initialBalance);
    });

    it("Should handle transfer to the owner's address", async function () {
        const initialBalance = await token.balanceOf(owner.address);
        await token.transfer(owner.address, ethers.parseEther("10"));
        expect(await token.balanceOf(owner.address)).to.equal(initialBalance);
    });

    it("Should handle transferFrom to the owner's address", async function () {
        await token.approve(addr1.address, ethers.parseEther("100"));
        const initialBalance = await token.balanceOf(owner.address);
        await token.connect(addr1).transferFrom(owner.address, owner.address, ethers.parseEther("50"));
        expect(await token.balanceOf(owner.address)).to.equal(initialBalance);
    });

    it("Should handle buying tokens when buyPrice is zero", async function () {
        await token.setPrices(ethers.parseEther("0.001"), 0);
        await expect(token.buy({ value: ethers.parseEther("1") })).to.be.reverted;
    });
});
