const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CGCToken", function () {
    let CGCToken, token, owner, addr1, addr2;

    beforeEach(async function () {
        [owner, addr1, addr2] = await ethers.getSigners();
        const initialSupply = ethers.parseEther("1000");
        CGCToken = await ethers.getContractFactory("CGCToken");
        token = await CGCToken.deploy(initialSupply, "CGC Token", "CGC");
    });

    it("Should deploy with correct initial supply", async function () {
        const totalSupply = await token.totalSupply();
        expect(totalSupply).to.equal(ethers.parseEther("1000000000000000000000"));
        const ownerBalance = await token.balanceOf(owner.address);
        expect(ownerBalance).to.equal(ethers.parseEther("1000000000000000000000"));
    });

    it("Should transfer tokens between accounts", async function () {
        await token.transfer(addr1.address, ethers.parseEther("100"));
        const addr1Balance = await token.balanceOf(addr1.address);
        expect(addr1Balance).to.equal(ethers.parseEther("100"));
    });

    it("Should fail transfer if sender does not have enough balance", async function () {
        await expect(
            token.connect(addr1).transfer(addr2.address, ethers.parseEther("1"))
        ).to.be.reverted;
    });

    it("Should allow owner to mint tokens", async function () {
        await token.mintToken(addr1.address, ethers.parseEther("500"));
        const addr1Balance = await token.balanceOf(addr1.address);
        expect(addr1Balance).to.equal(ethers.parseEther("500"));
        const totalSupply = await token.totalSupply();
        expect(totalSupply).to.equal(ethers.parseEther("1000000000000000000500"));
    });

    it("Should freeze and unfreeze accounts", async function () {
        await token.freezeAccount(addr1.address, true);
        await expect(
            token.connect(addr1).transfer(addr2.address, ethers.parseEther("1"))
        ).to.be.reverted;
        await token.freezeAccount(addr1.address, false);
        await token.transfer(addr1.address, ethers.parseEther("100"));
        await token.connect(addr1).transfer(addr2.address, ethers.parseEther("50"));
        const addr2Balance = await token.balanceOf(addr2.address);
        expect(addr2Balance).to.equal(ethers.parseEther("50"));
    });

    it("Should burn tokens", async function () {
        await token.burn(ethers.parseEther("100000000000000000000"));
        const ownerBalance = await token.balanceOf(owner.address);
        expect(ownerBalance).to.equal(ethers.parseEther("900000000000000000000"));
        const totalSupply = await token.totalSupply();
        expect(totalSupply).to.equal(ethers.parseEther("900000000000000000000"));
    });

    it("Should burn tokens from another account", async function () {
        await token.transfer(addr1.address, ethers.parseEther("100000000000000000000"));
        await token.connect(addr1).approve(owner.address, ethers.parseEther("50000000000000000000"));
        await token.burnFrom(addr1.address, ethers.parseEther("50000000000000000000"));
        const addr1Balance = await token.balanceOf(addr1.address);
        expect(addr1Balance).to.equal(ethers.parseEther("50000000000000000000"));
        const totalSupply = await token.totalSupply();
        expect(totalSupply).to.equal(ethers.parseEther("950000000000000000000"));
    });
});
