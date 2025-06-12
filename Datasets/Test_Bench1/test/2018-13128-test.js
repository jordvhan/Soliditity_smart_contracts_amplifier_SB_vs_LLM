const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ETY Contract", function () {
    let ETY, ety, owner, ico, addr1, addr2;

    beforeEach(async function () {
        [owner, ico, addr1, addr2] = await ethers.getSigners();
        const ETYFactory = await ethers.getContractFactory("ETY");
        ety = await ETYFactory.deploy(ico.address);
    });

    it("Should set the correct ICO address", async function () {
        expect(await ety.ico()).to.equal(ico.address);
    });

    it("Should mint tokens correctly", async function () {
        const mintAmount = ethers.parseEther("100");
        await ety.connect(ico).mint(addr1.address, mintAmount);
        expect(await ety.balanceOf(addr1.address)).to.equal(mintAmount);
        expect(await ety.totalSupply()).to.equal(mintAmount);
    });

    it("Should not allow non-ICO to mint tokens", async function () {
        const mintAmount = ethers.parseEther("100");
        await expect(ety.connect(addr1).mint(addr1.address, mintAmount)).to.be.reverted;
    });

    it("Should not allow non-ICO to burn tokens", async function () {
        const mintAmount = ethers.parseEther("100");
        await ety.connect(ico).mint(addr1.address, mintAmount);
        await expect(ety.connect(addr1).burn(mintAmount)).to.be.reverted;
    });

    it("Should unfreeze tokens correctly", async function () {
        expect(await ety.tokensAreFrozen()).to.be.true;
        await ety.connect(ico).unfreeze();
        expect(await ety.tokensAreFrozen()).to.be.false;
    });

    it("Should not allow non-ICO to unfreeze tokens", async function () {
        await expect(ety.connect(addr1).unfreeze()).to.be.reverted;
    });

    it("Should allow transfers when tokens are unfrozen", async function () {
        const mintAmount = ethers.parseEther("100");
        await ety.connect(ico).mint(addr1.address, mintAmount);
        await ety.connect(ico).unfreeze();
        await ety.connect(addr1).transfer(addr2.address, mintAmount);
        expect(await ety.balanceOf(addr2.address)).to.equal(mintAmount);
    });

    it("Should not allow transfers when tokens are frozen", async function () {
        const mintAmount = ethers.parseEther("100");
        await ety.connect(ico).mint(addr1.address, mintAmount);
        await expect(ety.connect(addr1).transfer(addr2.address, mintAmount)).to.be.reverted;
    });

    it("Should allow transferFrom when tokens are unfrozen", async function () {
        const mintAmount = ethers.parseEther("100");
        await ety.connect(ico).mint(addr1.address, mintAmount);
        await ety.connect(ico).unfreeze();
        await ety.connect(addr1).approve(addr2.address, mintAmount);
        await ety.connect(addr2).transferFrom(addr1.address, addr2.address, mintAmount);
        expect(await ety.balanceOf(addr2.address)).to.equal(mintAmount);
    });

    it("Should not allow transferFrom when tokens are frozen", async function () {
        const mintAmount = ethers.parseEther("100");
        await ety.connect(ico).mint(addr1.address, mintAmount);
        await expect(ety.connect(addr1).approve(addr2.address, mintAmount)).to.be.reverted;
        await expect(ety.connect(addr2).transferFrom(addr1.address, addr2.address, mintAmount)).to.be.reverted;
    });

    it("Should allow approvals when tokens are unfrozen", async function () {
        const approveAmount = ethers.parseEther("50");
        await ety.connect(ico).unfreeze();
        await ety.connect(addr1).approve(addr2.address, approveAmount);
        expect(await ety.allowance(addr1.address, addr2.address)).to.equal(approveAmount);
    });

    it("Should not allow approvals when tokens are frozen", async function () {
        const approveAmount = ethers.parseEther("50");
        await expect(ety.connect(addr1).approve(addr2.address, approveAmount)).to.be.reverted;
    });
});
