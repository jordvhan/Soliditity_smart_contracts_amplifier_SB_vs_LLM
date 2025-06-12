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
    });

    it("Should deploy with correct initial values", async function () {
        expect(await token.name()).to.equal("TestToken");
        expect(await token.symbol()).to.equal("TTK");
        expect(await token.decimals()).to.equal(18);
        expect(await token.totalSupply()).to.equal(ethers.parseEther("1000"));
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
        expect(await token.totalSupply()).to.equal(ethers.parseEther("1500"));
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

});
