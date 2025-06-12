const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("NGToken", function () {
    let NGToken, ngToken, owner, addr1, addr2, addr3;

    beforeEach(async function () {
        [owner, addr1, addr2, addr3] = await ethers.getSigners();
        const NGTokenFactory = await ethers.getContractFactory("NGToken");
        ngToken = await NGTokenFactory.deploy();
    });

    it("should have correct initial supply", async function () {
        const initialSupply = await ngToken.initialSupply();
        expect(initialSupply).to.equal(ethers.parseEther("20000000000"));
    });

    it("should assign the initial supply to the owner", async function () {
        const ownerBalance = await ngToken.balanceOf(owner.address);
        expect(ownerBalance).to.equal(await ngToken.initialSupply());
    });

    it("should transfer tokens between accounts", async function () {
        await ngToken.transfer(addr1.address, ethers.parseEther("100"));
        expect(await ngToken.balanceOf(addr1.address)).to.equal(ethers.parseEther("100"));
    });

    it("should fail if sender doesn’t have enough tokens", async function () {
        await expect(
            ngToken.connect(addr1).transfer(addr2.address, ethers.parseEther("1"))
        ).to.be.revertedWithoutReason();
    });

    it("should approve and allow spending by another account", async function () {
        await ngToken.approve(addr1.address, ethers.parseEther("50"));
        expect(await ngToken.allowance(owner.address, addr1.address)).to.equal(ethers.parseEther("50"));
    });

    it("should transfer tokens via transferFrom", async function () {
        await ngToken.approve(addr1.address, ethers.parseEther("50"));
        await ngToken.connect(addr1).transferFrom(owner.address, addr2.address, ethers.parseEther("50"));
        expect(await ngToken.balanceOf(addr2.address)).to.equal(ethers.parseEther("50"));
    });

    it("should burn tokens", async function () {
        await ngToken.burn(ethers.parseEther("100"), "0x");
        expect(await ngToken.currentBurned()).to.equal(ethers.parseEther("100"));
    });

    it("should burn tokens from another account", async function () {
        await ngToken.approve(addr1.address, ethers.parseEther("100"));
        await ngToken.connect(addr1).burnFrom(owner.address, ethers.parseEther("100"), "0x");
        expect(await ngToken.currentBurned()).to.equal(ethers.parseEther("100"));
    });

    it("should handle multipleTransfer correctly", async function () {
        const recipients = [addr1.address, addr2.address];
        await ngToken.multipleTransfer(recipients, ethers.parseEther("50"));
        expect(await ngToken.balanceOf(addr1.address)).to.equal(ethers.parseEther("50"));
        expect(await ngToken.balanceOf(addr2.address)).to.equal(ethers.parseEther("50"));
    });

    it("should handle batchTransfer correctly", async function () {
        const recipients = [addr1.address, addr2.address];
        const values = [ethers.parseEther("30"), ethers.parseEther("70")];
        await ngToken.batchTransfer(recipients, values);
        expect(await ngToken.balanceOf(addr1.address)).to.equal(ethers.parseEther("30"));
        expect(await ngToken.balanceOf(addr2.address)).to.equal(ethers.parseEther("70"));
    });

    it("should reject transfers to the zero address", async function () {
        await expect(
            ngToken.transfer("0x0000000000000000000000000000000000000000", ethers.parseEther("1"))
        ).to.be.revertedWithoutReason();
    });

    it("should reject batchTransfer with mismatched arrays", async function () {
        const recipients = [addr1.address];
        const values = [ethers.parseEther("30"), ethers.parseEther("70")];
        await expect(ngToken.batchTransfer(recipients, values)).to.be.revertedWithoutReason();
    });


    it("should reject burn with insufficient balance", async function () {
        await expect(ngToken.connect(addr1).burn(ethers.parseEther("1"), "0x")).to.be.revertedWithoutReason();
    });

    it("should reject burnFrom with insufficient allowance", async function () {
        await expect(ngToken.connect(addr1).burnFrom(owner.address, ethers.parseEther("1"), "0x")).to.be.revertedWithoutReason();
    });

    it("should reject approve if not forced to zero first", async function () {
        await ngToken.approve(addr1.address, ethers.parseEther("50"));
        await expect(ngToken.approve(addr1.address, ethers.parseEther("100"))).to.be.revertedWithoutReason();
    });
});
