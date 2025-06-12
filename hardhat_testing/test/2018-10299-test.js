const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("BecToken", function () {
    let BecToken, becToken, owner, addr1, addr2, addrs;

    beforeEach(async function () {
        BecToken = await ethers.getContractFactory("BecToken");
        [owner, addr1, addr2, ...addrs] = await ethers.getSigners();
        becToken = await BecToken.deploy();
    });

    describe("Deployment", function () {
        it("Should set the right owner", async function () {
            expect(await becToken.owner()).to.equal(owner.address);
        });

        it("Should assign the total supply of tokens to the owner", async function () {
            const ownerBalance = await becToken.balanceOf(owner.address);
            expect(await becToken.totalSupply()).to.equal(ownerBalance);
        });

        it("Should have correct name, symbol and decimals", async function () {
            expect(await becToken.name()).to.equal("BeautyChain");
            expect(await becToken.symbol()).to.equal("BEC");
            expect(await becToken.decimals()).to.equal(18);
        });
    });

    describe("Transactions", function () {
        it("Should transfer tokens between accounts", async function () {
            const amount = ethers.parseEther("50");
            await becToken.transfer(addr1.address, amount);
            expect(await becToken.balanceOf(addr1.address)).to.equal(amount);

            await becToken.connect(addr1).transfer(addr2.address, amount);
            expect(await becToken.balanceOf(addr2.address)).to.equal(amount);
        });
    });

    describe("BatchTransfer", function () {
        it("Should transfer tokens to multiple addresses", async function () {
            const amount = ethers.parseEther("100");
            const receivers = [addr1.address, addr2.address];
            
            await becToken.batchTransfer(receivers, amount);
            
            expect(await becToken.balanceOf(addr1.address)).to.equal(amount);
            expect(await becToken.balanceOf(addr2.address)).to.equal(amount);
        });

        it("Should fail if batch transfer exceeds balance", async function () {
            const amount = ethers.parseEther("100");
            const receivers = [addr1.address, addr2.address];
            await expect(becToken.batchTransfer(receivers, amount)).to.be.revertedWith("revert");
        });

        it("Should fail if batch transfer exceeds the limit of 20 addresses", async function () {
            const receivers = Array(21).fill(addr1.address);
            const amount = ethers.parseEther("1");
            await expect(becToken.batchTransfer(receivers, amount)).to.be.revertedWith("revert");
        });
    });

    describe("Paused State", function () {
        it("Should prevent transfers when paused", async function () {
            const amount = ethers.parseEther("50");
            await becToken.pause();
            await expect(becToken.transfer(addr1.address, amount)).to.be.revertedWith("revert");
        });

        it("Should allow transfers when unpaused", async function () {
            const amount = ethers.parseEther("50");
            await becToken.pause();
            await becToken.unpause();
            await becToken.transfer(addr1.address, amount);
            expect(await becToken.balanceOf(addr1.address)).to.equal(amount);
        });
    });

    describe("Invalid Inputs", function () {
        it("Should fail when transferring to the zero address", async function () {
            const amount = ethers.parseEther("50");
            await expect(becToken.transfer(ethers.constants.AddressZero, amount)).to.be.revertedWith("revert");
        });

        it("Should fail when approving zero address as spender", async function () {
            const amount = ethers.parseEther("50");
            await expect(becToken.approve(ethers.constants.AddressZero, amount)).to.be.revertedWith("revert");
        });

        it("Should fail when transferring more than balance", async function () {
            const amount = ethers.parseEther("10000000000"); // Exceeds total supply
            await expect(becToken.transfer(addr1.address, amount)).to.be.revertedWith("revert");
        });
    });

    describe("Ownership", function () {
        it("Should transfer ownership", async function () {
            await becToken.transferOwnership(addr1.address);
            expect(await becToken.owner()).to.equal(addr1.address);
        });

        it("Should prevent non-owners from transferring ownership", async function () {
            await expect(becToken.connect(addr1).transferOwnership(addr2.address)).to.be.revertedWith("revert");
        });
    });
});
