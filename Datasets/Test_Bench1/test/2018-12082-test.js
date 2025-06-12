const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("FujintoToken Contract", function () {
    let FujintoToken, token, owner, addr1, addr2;

    beforeEach(async function () {
        [owner, addr1, addr2] = await ethers.getSigners();
        const initialSupply = ethers.parseEther("1000");
        FujintoToken = await ethers.getContractFactory("FujintoToken");
        token = await FujintoToken.deploy(initialSupply, "Fujinto", 18, "FUJ");
    });

    it("Should deploy with correct initial supply", async function () {
        const totalSupply = await token.totalSupply();
        expect(totalSupply).to.equal(ethers.parseEther("1000"));
        const ownerBalance = await token.balanceOf(owner.address);
        expect(ownerBalance).to.equal(ethers.parseEther("1000"));
    });

    it("Should transfer tokens between accounts", async function () {
        await token.transfer(addr1.address, ethers.parseEther("100"));
        const addr1Balance = await token.balanceOf(addr1.address);
        expect(addr1Balance).to.equal(ethers.parseEther("100"));
    });

    it("Should fail if sender doesn’t have enough tokens", async function () {
        await expect(
            token.connect(addr1).transfer(addr2.address, ethers.parseEther("1"))
        ).to.be.reverted;
    });

    it("Should allow owner to mint tokens", async function () {
        await token.mintToken(addr1.address, ethers.parseEther("500"));
        const addr1Balance = await token.balanceOf(addr1.address);
        expect(addr1Balance).to.equal(ethers.parseEther("500"));
    });

    it("Should freeze and unfreeze accounts", async function () {
        await token.freezeAccount(owner.address, true);
        await expect(
            token.connect(owner).transfer(addr2.address, ethers.parseEther("1"))
        ).to.be.reverted;

        await token.freezeAccount(owner.address, false);
        await token.connect(owner).transfer(addr2.address, ethers.parseEther("1"));
    });

    it("Should allow buying tokens", async function () {
        await token.setSelling(true);
        await token.connect(addr1).buy({ value: ethers.parseEther("1") });
        const addr1Balance = await token.balanceOf(addr1.address);
        expect(addr1Balance).to.equal(ethers.parseEther("4000")); // buyRate = 4000
    });

    it("Should allow owner to withdraw funds", async function () {
        const initialOwnerBalance = await ethers.provider.getBalance(owner.address);
        await token.connect(addr1).buy({ value: ethers.parseEther("1") });
        await token.withdrawToOwner(ethers.parseEther("1"));
        const finalOwnerBalance = await ethers.provider.getBalance(owner.address);
        expect(finalOwnerBalance).to.be.above(initialOwnerBalance);
    });

    it("Should update buy rate and selling status", async function () {
        await token.setBuyRate(5000);
        const newBuyRate = await token.buyRate();
        expect(newBuyRate).to.equal(5000);

        await token.setSelling(false);
        const sellingStatus = await token.isSelling();
        expect(sellingStatus).to.be.false;
    });
});
