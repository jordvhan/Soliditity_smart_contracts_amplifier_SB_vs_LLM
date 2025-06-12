const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("FIBToken Contract", function () {
    let owner, addr1, addr2, token;

    beforeEach(async function () {
        const FIBToken = await ethers.getContractFactory("FIBToken");
        token = await FIBToken.deploy();
        [owner, addr1, addr2] = await ethers.getSigners();
    });

    it("Should initialize with correct values", async function () {
        expect(await token.name()).to.equal("FIB");
        expect(await token.symbol()).to.equal("FIB");
        expect(await token.decimals()).to.equal(18);
        expect(await token.totalSupply()).to.equal(ethers.parseEther("5000000000"));
        expect(await token.balanceOf(owner.address)).to.equal(ethers.parseEther("5000000000"));
    });

    it("Should transfer tokens correctly", async function () {
        await token.transfer(addr1.address, ethers.parseEther("100"));
        expect(await token.balanceOf(addr1.address)).to.equal(ethers.parseEther("100"));
        expect(await token.balanceOf(owner.address)).to.equal(ethers.parseEther("4999999900"));
    });

    it("Should fail transfer if balance is insufficient", async function () {
        await expect(token.connect(addr1).transfer(addr2.address, ethers.parseEther("100"))).to.be.reverted;
    });

    it("Should approve and allow transferFrom", async function () {
        await token.approve(addr1.address, ethers.parseEther("200"));
        expect(await token.allowance(owner.address, addr1.address)).to.equal(ethers.parseEther("200"));

        await token.connect(addr1).transferFrom(owner.address, addr2.address, ethers.parseEther("100"));
        expect(await token.balanceOf(addr2.address)).to.equal(ethers.parseEther("100"));
        expect(await token.balanceOf(owner.address)).to.equal(ethers.parseEther("4999999900"));
    });

    it("Should fail transferFrom if allowance is insufficient", async function () {
        await expect(token.connect(addr1).transferFrom(owner.address, addr2.address, ethers.parseEther("100"))).to.be.reverted;
    });

    it("Should burn tokens correctly", async function () {
        await token.burn(ethers.parseEther("100"));
        expect(await token.totalSupply()).to.equal(ethers.parseEther("4999999900"));
        expect(await token.balanceOf(owner.address)).to.equal(ethers.parseEther("4999999900"));
    });

    it("Should fail burn if balance is insufficient", async function () {
        await expect(token.connect(addr1).burn(ethers.parseEther("100"))).to.be.reverted;
    });

    it("Should burn tokens from another account correctly", async function () {
        await token.approve(addr1.address, ethers.parseEther("100"));
        await token.connect(addr1).burnFrom(owner.address, ethers.parseEther("100"));
        expect(await token.totalSupply()).to.equal(ethers.parseEther("4999999900"));
        expect(await token.balanceOf(owner.address)).to.equal(ethers.parseEther("4999999900"));
    });

    it("Should fail burnFrom if allowance is insufficient", async function () {
        await expect(token.connect(addr1).burnFrom(owner.address, ethers.parseEther("100"))).to.be.reverted;
    });

    it("Should mint tokens correctly", async function () {
        await token.mintToken(addr1.address, ethers.parseEther("100"));
        expect(await token.totalSupply()).to.equal(ethers.parseEther("5000000100"));
        expect(await token.balanceOf(addr1.address)).to.equal(ethers.parseEther("100"));
    });

    it("Should freeze and unfreeze accounts", async function () {
        await token.freezeAccount(addr1.address, true);
        expect(await token.frozenAccount(addr1.address)).to.equal(true);

        await expect(token.connect(addr1).transfer(addr2.address, ethers.parseEther("100"))).to.be.reverted;

        await token.freezeAccount(addr1.address, false);
        expect(await token.frozenAccount(addr1.address)).to.equal(false);
    });

    it("Should fail transfer if sender or recipient is frozen", async function () {
        await token.freezeAccount(addr1.address, true);
        await expect(token.transfer(addr1.address, ethers.parseEther("100"))).to.be.reverted;
    });
});
