const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MyAdvancedToken", function () {
    let Token, token, owner, addr1, addr2, tokenRecipient;

    beforeEach(async function () {
        [owner, addr1, addr2, tokenRecipient] = await ethers.getSigners();
        Token = await ethers.getContractFactory("contracts/2018-12067.sol:MyAdvancedToken");
        token = await Token.deploy(
            1000, // initialSupply
            "TestToken", // tokenName
            18, // decimalUnits
            "TTK" // tokenSymbol
        );
    });

    it("Should deploy with correct initial values", async function () {
        expect(await token.name()).to.equal("TestToken");
        expect(await token.symbol()).to.equal("TTK");
        expect(await token.decimals()).to.equal(18);
        expect(await token.totalSupply()).to.equal(1000);
        expect(await token.balanceOf(owner.address)).to.equal(1000);
    });

    it("Should transfer ownership", async function () {
        await token.transferOwnership(addr1.address);
        expect(await token.owner()).to.equal(addr1.address);
         // Transfer ownership back to the original owner for subsequent tests
         await token.connect(addr1).transferOwnership(owner.address);
         expect(await token.owner()).to.equal(owner.address);
    });

    it("Should transfer tokens between accounts", async function () {
        await token.transfer(addr1.address, 100);
        expect(await token.balanceOf(owner.address)).to.equal(900);
        expect(await token.balanceOf(addr1.address)).to.equal(100);
    });

    it("Should not allow transfer if sender has insufficient balance", async function () {
        await expect(token.connect(addr1).transfer(addr2.address, 100)).to.be.reverted;
    });

    it("Should mint new tokens", async function () {
        await token.mintToken(addr1.address, 500);
        expect(await token.totalSupply()).to.equal(1500);
        expect(await token.balanceOf(addr1.address)).to.equal(500);
    });

    it("Should freeze and unfreeze accounts", async function () {
        await token.freezeAccount(addr1.address, true);
        await expect(token.connect(addr1).transfer(addr2.address, 100)).to.be.reverted;
        await token.freezeAccount(addr1.address, false);
        await token.transfer(addr1.address, 100);
        await token.connect(addr1).transfer(addr2.address, 50);
        expect(await token.balanceOf(addr2.address)).to.equal(50);
    });

    it("Should set buy and sell prices", async function () {
        await token.setPrices(ethers.parseEther("0.01"), ethers.parseEther("0.02"));
        expect(await token.sellPrice()).to.equal(ethers.parseEther("0.01"));
        expect(await token.buyPrice()).to.equal(ethers.parseEther("0.02"));
    });

    it("Should prevent buying if contract has insufficient tokens", async function () {
        await token.setPrices(ethers.parseEther("0.01"), ethers.parseEther("0.02"));
        await expect(token.connect(addr1).buy({ value: ethers.parseEther("1") })).to.be.reverted;
    });

    it("Should prevent selling if user has insufficient tokens", async function () {
        await token.setPrices(ethers.parseEther("0.01"), ethers.parseEther("0.02"));
        await expect(token.connect(addr1).sell(100)).to.be.reverted;
    });

    it("Should prevent selling if contract has insufficient ether", async function () {
        await token.setPrices(ethers.parseEther("1"), ethers.parseEther("2"));
        await token.transfer(addr1.address, 100);
        // Attempting to sell when the contract has no ether should fail.
        await expect(token.connect(addr1).sell(50)).to.be.reverted;
    });

    it("Should prevent setting prices by non-owner", async function () {
        await expect(token.connect(addr1).setPrices(ethers.parseEther("0.01"), ethers.parseEther("0.02"))).to.be.reverted;
    });

    it("Should prevent minting tokens by non-owner", async function () {
        await expect(token.connect(addr1).mintToken(addr2.address, 100)).to.be.reverted;
    });

    it("Should prevent freezing accounts by non-owner", async function () {
        await expect(token.connect(addr1).freezeAccount(addr2.address, true)).to.be.reverted;
    });

    it("Should prevent transferring ownership by non-owner", async function () {
        await expect(token.connect(addr1).transferOwnership(addr2.address)).to.be.reverted;
    });

    it("Should allow approve", async function () {
        await token.approve(addr1.address, 100);
        expect(await token.allowance(owner.address, addr1.address)).to.equal(100);
    });

    it("Should allow transferFrom", async function () {
        await token.transfer(addr1.address, 200);
        await token.connect(addr1).approve(owner.address, 100);
        await token.transferFrom(addr1.address, addr2.address, 50);
        expect(await token.balanceOf(addr1.address)).to.equal(150);
        expect(await token.balanceOf(addr2.address)).to.equal(50);
        expect(await token.allowance(addr1.address, owner.address)).to.equal(50);
    });

    it("Should prevent transferFrom if allowance is not enough", async function () {
        await token.transfer(addr1.address, 100);
        await token.connect(addr1).approve(owner.address, 50);
        await expect(token.transferFrom(addr1.address, addr2.address, 100)).to.be.reverted;
    });

    it("Should test the token constructor", async function () {
        const name = await token.name();
        const symbol = await token.symbol();
        const decimals = await token.decimals();
        const totalSupply = await token.totalSupply();

        expect(name).to.equal("TestToken");
        expect(symbol).to.equal("TTK");
        expect(decimals).to.equal(18);
        expect(totalSupply).to.equal(1000);
    });

    it("Should prevent transfer if sender is frozen", async function () {
        await token.freezeAccount(owner.address, true);
        await expect(token.transfer(addr1.address, 100)).to.be.reverted;
    });

    it("Should revert if try to sell more tokens than owned", async function () {
        await token.setPrices(ethers.parseEther("0.001"), ethers.parseEther("0.002"));
        const sellAmount = 10000;
        await expect(token.connect(addr1).sell(sellAmount)).to.be.reverted;
    });

    it("Should revert if try to buy when contract does not have enough tokens", async function () {
        await token.setPrices(ethers.parseEther("0.001"), ethers.parseEther("0.002"));
        const etherValue = ethers.parseEther("1");
        await expect(token.connect(addr1).buy({ value: etherValue })).to.be.reverted;
    });
});
