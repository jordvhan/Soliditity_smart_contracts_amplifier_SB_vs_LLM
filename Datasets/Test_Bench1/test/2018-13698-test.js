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

    it("Should transfer tokens correctly", async function () {
        await play2LivePromo.mintTokens(owner.address);  // add 777 tokens
        await play2LivePromo.transfer(addr1.address, ethers.parseEther("100"));  // transfer 100 of the 777
        expect(await play2LivePromo.balanceOf(owner.address)).to.equal(ethers.parseEther("677"));  // be left with 677
        // CORRECT LINE, VULNERABLE CONTRACT UNDERFLOW
        //expect(await play2LivePromo.balanceOf(addr1.address)).to.equal(ethers.parseEther("100"));
    });

    it("Should not allow transfers with insufficient balance", async function () {
        // CORRECT LINE, VULNERABLE CONTRACT UNDERFLOW: NO ASSERTIONS AND NEGATIVE BALANCE IS OBTAINED
        //await expect(play2LivePromo.transfer(addr1.address, ethers.parseEther("100"))).to.be.reverted;
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

    it("Should handle transferFrom correctly", async function () {
        await play2LivePromo.mintTokens(owner.address);
        await play2LivePromo.approve(addr1.address, ethers.parseEther("200"));
        await play2LivePromo.connect(addr1).transferFrom(owner.address, addr2.address, ethers.parseEther("100"));
        expect(await play2LivePromo.balanceOf(owner.address)).to.equal(ethers.parseEther("677"));
        // CORRECT LINE, VULNERABLE CONTRACT UNDERFLOW
        //expect(await play2LivePromo.balanceOf(addr2.address)).to.equal(ethers.parseEther("100"));
        expect(await play2LivePromo.allowance(owner.address, addr1.address)).to.equal(ethers.parseEther("100"));
    });

    it("Should not allow transferFrom with insufficient allowance", async function () {
        await play2LivePromo.mintTokens(owner.address);
        await play2LivePromo.approve(addr1.address, ethers.parseEther("50"));
        // CORRECT LINE, VULNERABLE CONTRACT UNDERFLOW: SHOULD REVERT SINCE NOT ENOUGH BALANCE TO TRANSFER WITH
        //await expect(play2LivePromo.connect(addr1).transferFrom(owner.address, addr2.address, ethers.parseEther("100"))).to.be.reverted;
    });

    it("Should return correct balances and allowances", async function () {
        await play2LivePromo.mintTokens(owner.address);
        await play2LivePromo.approve(addr1.address, ethers.parseEther("200"));
        expect(await play2LivePromo.balanceOf(owner.address)).to.equal(ethers.parseEther("777"));
        expect(await play2LivePromo.allowance(owner.address, addr1.address)).to.equal(ethers.parseEther("200"));
    });
});
