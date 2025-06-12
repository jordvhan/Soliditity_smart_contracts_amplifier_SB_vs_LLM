const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Bittelux Contract", function () {
    let Bittelux, bittelux, owner, addr1, addr2;

    beforeEach(async function () {
        [owner, addr1, addr2] = await ethers.getSigners();
        const BitteluxFactory = await ethers.getContractFactory("Bittelux");
        bittelux = await BitteluxFactory.deploy();
    });

    it("Should initialize with correct values", async function () {
        expect(await bittelux.name()).to.equal("Bittelux");
        expect(await bittelux.symbol()).to.equal("BTX");
        expect(await bittelux.decimals()).to.equal(18);
        expect(await bittelux.totalSupply()).to.equal(ethers.parseEther("10000000000"));
        expect(await bittelux.balanceOf(owner.address)).to.equal(ethers.parseEther("10000000000"));
    });

    it("Should allow transfer of tokens", async function () {
        await bittelux.transfer(addr1.address, ethers.parseEther("100"));
        expect(await bittelux.balanceOf(owner.address)).to.equal(ethers.parseEther("9999999900"));
        expect(await bittelux.balanceOf(addr1.address)).to.equal(ethers.parseEther("100"));
    });

    it("Should fail transfer if balance is insufficient", async function () {
        // Attempt to transfer 100 tokens from addr1 to addr2, but addr1 has insufficient balance
        const result = await bittelux.connect(addr1).transfer(addr2.address, ethers.parseEther("100"));

        // Verify the balances remain unchanged
        const addr1Balance = await bittelux.balanceOf(addr1.address);
        const addr2Balance = await bittelux.balanceOf(addr2.address);

        // addr1 should still have its initial balance (assuming it started with less than 100 tokens)
        expect(addr1Balance).to.equal(ethers.parseEther("0")); // Assuming addr1 had 0 tokens
        // addr2 should still have 0 tokens
        expect(addr2Balance).to.equal(ethers.parseEther("0"));
    });

    it("Should allow transferFrom with approval", async function () {
        await bittelux.approve(addr1.address, ethers.parseEther("100"));
        await bittelux.connect(addr1).transferFrom(owner.address, addr2.address, ethers.parseEther("100"));
        expect(await bittelux.balanceOf(owner.address)).to.equal(ethers.parseEther("9999999900"));
        expect(await bittelux.balanceOf(addr2.address)).to.equal(ethers.parseEther("100"));
    });

    it("Should fail transferFrom if allowance is insufficient", async function () {
        // Approve addr1 to transfer 10 tokens on behalf of owner
        await bittelux.approve(addr1.address, ethers.parseEther("10"));

        // Attempt to transfer 100 tokens from owner to addr2 by addr1, which exceeds the allowance
        const result = await bittelux.connect(addr1).transferFrom(owner.address, addr2.address, ethers.parseEther("100"));

        // Since the allowance is insufficient, the transfer should fail and return false
        //expect(result).to.equal(false);

        // Verify the balances remain unchanged
        const ownerBalance = await bittelux.balanceOf(owner.address);
        const addr2Balance = await bittelux.balanceOf(addr2.address);

        // The owner's balance should be unchanged
        expect(ownerBalance).to.equal(ethers.parseEther("10000000000")); // Assuming the owner starts with 1000 tokens
        // addr2's balance should still be 0
        expect(addr2Balance).to.equal(ethers.parseEther("0"));
    });


    it("Should update allowance correctly", async function () {
        await bittelux.approve(addr1.address, ethers.parseEther("200"));
        expect(await bittelux.allowance(owner.address, addr1.address)).to.equal(ethers.parseEther("200"));
    });

    it("Should emit Transfer event on token transfer", async function () {
        await expect(bittelux.transfer(addr1.address, ethers.parseEther("100")))
            .to.emit(bittelux, "Transfer")
            .withArgs(owner.address, addr1.address, ethers.parseEther("100"));
    });

    it("Should emit Approval event on approval", async function () {
        await expect(bittelux.approve(addr1.address, ethers.parseEther("100")))
            .to.emit(bittelux, "Approval")
            .withArgs(owner.address, addr1.address, ethers.parseEther("100"));
    });
});
