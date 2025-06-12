const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Play2LivePromo Contract", function () {
    let Play2LivePromo, play2LivePromo, owner, addr1, addr2;

    beforeEach(async function () {
        [owner, addr1, addr2] = await ethers.getSigners();
        const Play2LivePromoFactory = await ethers.getContractFactory("Play2LivePromo");
        play2LivePromo = await Play2LivePromoFactory.deploy();
    });

    it("Should set the correct owner", async function () {
        expect(await play2LivePromo.owner()).to.equal(owner.address);
    });

    it("Should allow the owner to set a new promo value", async function () {
        await play2LivePromo.setPromo(ethers.parseEther("1000"));
        // Promo value is private, so we test indirectly by minting tokens
        await play2LivePromo.mintTokens(addr1.address);
        expect(await play2LivePromo.balanceOf(addr1.address)).to.equal(ethers.parseEther("1000"));
    });

    it("Should not allow non-owners to set a new promo value", async function () {
        await expect(play2LivePromo.connect(addr1).setPromo(ethers.parseEther("1000"))).to.be.reverted;
    });

    it("Should mint tokens correctly", async function () {
        await play2LivePromo.mintTokens(addr1.address);
        expect(await play2LivePromo.balanceOf(addr1.address)).to.equal(ethers.parseEther("777"));
        expect(await play2LivePromo.totalSupply()).to.equal(ethers.parseEther("777"));
    });

    it("Should not allow non-owners to mint tokens", async function () {
        await expect(play2LivePromo.connect(addr1).mintTokens(addr1.address)).to.be.reverted;
    });

    it("Should approve tokens correctly", async function () {
        await play2LivePromo.mintTokens(owner.address);
        await play2LivePromo.approve(addr1.address, ethers.parseEther("200"));
        expect(await play2LivePromo.allowance(owner.address, addr1.address)).to.equal(ethers.parseEther("200"));
    });

    it("Should not allow approvals without resetting allowance to zero first", async function () {
        await play2LivePromo.mintTokens(owner.address);
        await play2LivePromo.approve(addr1.address, ethers.parseEther("200"));
        await expect(play2LivePromo.approve(addr1.address, ethers.parseEther("300"))).to.be.reverted;
    });

    it("Should return correct balances and allowances", async function () {
        await play2LivePromo.mintTokens(owner.address);
        await play2LivePromo.approve(addr1.address, ethers.parseEther("200"));
        expect(await play2LivePromo.balanceOf(owner.address)).to.equal(ethers.parseEther("777"));
        expect(await play2LivePromo.allowance(owner.address, addr1.address)).to.equal(ethers.parseEther("200"));
    });

    it("Should handle zero allowance approval correctly", async function () {
        await play2LivePromo.mintTokens(owner.address);
        await play2LivePromo.approve(addr1.address, ethers.parseEther("0"));
        expect(await play2LivePromo.allowance(owner.address, addr1.address)).to.equal(ethers.parseEther("0"));
    });

    it("Should handle approving from zero allowance correctly", async function () {
        await play2LivePromo.mintTokens(owner.address);
        await play2LivePromo.approve(addr1.address, ethers.parseEther("0"));
        await play2LivePromo.approve(addr1.address, ethers.parseEther("200"));
        expect(await play2LivePromo.allowance(owner.address, addr1.address)).to.equal(ethers.parseEther("200"));
    });

    it("Should emit Transfer event on minting", async function () {
        await expect(play2LivePromo.mintTokens(addr1.address))
            .to.emit(play2LivePromo, "Transfer")
            .withArgs('0x0000000000000000000000000000000000000000', addr1.address, ethers.parseEther("777"));
    });

    it("Should emit Approval event on approving", async function () {
        await play2LivePromo.mintTokens(owner.address);
        await expect(play2LivePromo.approve(addr1.address, ethers.parseEther("200")))
            .to.emit(play2LivePromo, "Approval")
            .withArgs(owner.address, addr1.address, ethers.parseEther("200"));
    });
});
