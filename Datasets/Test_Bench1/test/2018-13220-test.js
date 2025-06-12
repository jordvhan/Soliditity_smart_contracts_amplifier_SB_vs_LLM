const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MAVCash Contract", function () {
    let MAVCash, mavCash, owner, addr1, addr2;

    beforeEach(async function () {
        [owner, addr1, addr2] = await ethers.getSigners();
        MAVCash = await ethers.getContractFactory("MAVCash");
        mavCash = await MAVCash.deploy(
            1000, // initialSupply
            "MAVCash", // tokenName
            18, // decimalUnits
            "MVC" // tokenSymbol
        );
    });

    it("Should initialize with correct values", async function () {
        expect(await mavCash.name()).to.equal("MAVCash");
        expect(await mavCash.symbol()).to.equal("MVC");
        expect(await mavCash.decimals()).to.equal(18);
        expect(await mavCash.totalSupply()).to.equal(1000);
        expect(await mavCash.balanceOf(owner.address)).to.equal(1000);
    });

    it("Should transfer tokens between accounts", async function () {
        await mavCash.transfer(addr1.address, 100);
        expect(await mavCash.balanceOf(owner.address)).to.equal(900);
        expect(await mavCash.balanceOf(addr1.address)).to.equal(100);
    });

    it("Should fail transfer if sender does not have enough balance", async function () {
        await expect(mavCash.connect(addr1).transfer(addr2.address, 100)).to.be.reverted;
    });

    it("Should allow accounts to approve and transferFrom", async function () {
        await mavCash.approve(addr1.address, 100);
        expect(await mavCash.allowance(owner.address, addr1.address)).to.equal(100);

        await mavCash.connect(addr1).transferFrom(owner.address, addr2.address, 100);
        expect(await mavCash.balanceOf(owner.address)).to.equal(900);
        expect(await mavCash.balanceOf(addr2.address)).to.equal(100);
    });

    it("Should mint new tokens", async function () {
        await mavCash.mintToken(addr1.address, 500);
        expect(await mavCash.totalSupply()).to.equal(1500);
        expect(await mavCash.balanceOf(addr1.address)).to.equal(500);
    });

    it("Should freeze and unfreeze accounts", async function () {
        await mavCash.freezeAccount(addr1.address, true);
        await expect(mavCash.connect(addr1).transfer(addr2.address, 100)).to.be.reverted;

        await mavCash.freezeAccount(addr1.address, false);
        await mavCash.transfer(addr1.address, 100);
        await mavCash.connect(addr1).transfer(addr2.address, 50);
        expect(await mavCash.balanceOf(addr2.address)).to.equal(50);
    });

    it("Should set buy and sell prices", async function () {
        await mavCash.setPrices(ethers.parseEther("0.01"), ethers.parseEther("0.02"));
        expect(await mavCash.sellPrice()).to.equal(ethers.parseEther("0.01"));
        expect(await mavCash.buyPrice()).to.equal(ethers.parseEther("0.02"));
    });
});
