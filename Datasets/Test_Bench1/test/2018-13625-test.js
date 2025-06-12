const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Krown Contract", function () {
    let Krown, krown, owner, addr1, addr2;

    beforeEach(async function () {
        [owner, addr1, addr2] = await ethers.getSigners();
        const initialSupply = ethers.parseEther("1000");
        Krown = await ethers.getContractFactory("Krown");
        krown = await Krown.deploy(initialSupply, "KrownToken", 18, "KT", owner.address);
    });

    it("Should set the correct initial supply and owner", async function () {
        expect(await krown.totalSupply()).to.equal(ethers.parseEther("1000"));
        expect(await krown.centralAuthority()).to.equal(owner.address);
    });

    it("Should transfer tokens between accounts", async function () {
        await krown.transfer(addr1.address, ethers.parseEther("100"));
        expect(await krown.balanceOf(addr1.address)).to.equal(ethers.parseEther("100"));
    });

    it("Should allow token approval and transferFrom", async function () {
        await krown.approve(addr1.address, ethers.parseEther("50"));
        expect(await krown.allowance(owner.address, addr1.address)).to.equal(ethers.parseEther("50"));

        await krown.connect(addr1).transferFrom(owner.address, addr2.address, ethers.parseEther("50"));
        expect(await krown.balanceOf(addr2.address)).to.equal(ethers.parseEther("50"));
    });

    it("Should freeze and unfreeze accounts", async function () {
        await krown.freezelvlAccount(addr1.address, true);
        await expect(krown.connect(addr1).transfer(addr2.address, ethers.parseEther("10"))).to.be.reverted;

        await krown.freezelvlAccount(addr1.address, false);
        await krown.transfer(addr1.address, ethers.parseEther("10"));
        expect(await krown.balanceOf(addr1.address)).to.equal(ethers.parseEther("10"));
    });

    it("Should mint new tokens", async function () {
        await krown.mintlvlToken(addr1.address, ethers.parseEther("500"));
        expect(await krown.totalSupply()).to.equal(ethers.parseEther("1500"));
        expect(await krown.balanceOf(addr1.address)).to.equal(ethers.parseEther("500"));
    });

    it("Should burn tokens", async function () {
        await krown.transfer(addr1.address, ethers.parseEther("100"));
        await krown.burnlvlToken(addr1.address, ethers.parseEther("50"));
        expect(await krown.balanceOf(addr1.address)).to.equal(ethers.parseEther("50"));
        expect(await krown.totalSupply()).to.equal(ethers.parseEther("950"));
    });

    it("Should lend tokens", async function () {
        await krown.lend(addr1.address, ethers.parseEther("100"), 30);
        expect(await krown.balanceOf(addr1.address)).to.equal(ethers.parseEther("100"));
    });

    it("Should repay loans", async function () {
        await krown.transfer(addr1.address, ethers.parseEther("100"));
        await krown.connect(addr1).repayLoan(owner.address, ethers.parseEther("50"), "0x" + "0".repeat(64));
        expect(await krown.balanceOf(owner.address)).to.equal(ethers.parseEther("950"));
    });

    it("Should update contract metadata", async function () {
        await krown.setlvlSign("New Sign");
        expect(await krown.sign()).to.equal("New Sign");

        await krown.setlvlNominalValue("New Value");
        expect(await krown.nominalValue()).to.equal("New Value");

        await krown.setlvlWebsite("https://example.com");
        expect(await krown.website()).to.equal("https://example.com");
    });
});
