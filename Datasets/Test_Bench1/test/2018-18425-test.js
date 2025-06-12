const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Primeo Contract", function () {
    let Primeo, primeo, owner, addr1, addr2, addrs;

    beforeEach(async function () {
        [owner, addr1, addr2, ...addrs] = await ethers.getSigners();
        Primeo = await ethers.getContractFactory("Primeo");
        primeo = await Primeo.deploy();
    });

    it("Should set the correct owner", async function () {
        expect(await primeo.runner.address).to.equal(owner.address);
    });

    it("Should distribute tokens correctly", async function () {
        const amount = ethers.parseEther("1000");
        await primeo.adminClaimAirdrop(addr1.address, amount);
        expect(await primeo.balanceOf(addr1.address)).to.equal(amount);
    });

    it("Should allow token transfers", async function () {
        const amount = ethers.parseEther("1000");
        await primeo.adminClaimAirdrop(addr1.address, amount);

        await primeo.connect(addr1).transfer(addr2.address, ethers.parseEther("500"));
        expect(await primeo.balanceOf(addr1.address)).to.equal(ethers.parseEther("500"));
        expect(await primeo.balanceOf(addr2.address)).to.equal(ethers.parseEther("500"));
    });

    it("Should not allow transfers exceeding balance", async function () {
        const amount = ethers.parseEther("1000");
        await primeo.adminClaimAirdrop(addr1.address, amount);

        await expect(
            primeo.connect(addr1).transfer(addr2.address, ethers.parseEther("1500"))
        ).to.be.revertedWithoutReason()
    });

    it("Should allow approvals and transferFrom", async function () {
        const amount = ethers.parseEther("1000");
        await primeo.adminClaimAirdrop(addr1.address, amount);

        await primeo.connect(addr1).approve(addr2.address, ethers.parseEther("500"));
        expect(await primeo.allowance(addr1.address, addr2.address)).to.equal(ethers.parseEther("500"));

        await primeo.connect(addr2).transferFrom(addr1.address, addr2.address, ethers.parseEther("500"));
        expect(await primeo.balanceOf(addr1.address)).to.equal(ethers.parseEther("500"));
        expect(await primeo.balanceOf(addr2.address)).to.equal(ethers.parseEther("500"));
    });

    it("Should not allow transferFrom exceeding allowance", async function () {
        const amount = ethers.parseEther("1000");
        await primeo.adminClaimAirdrop(addr1.address, amount);

        await primeo.connect(addr1).approve(addr2.address, ethers.parseEther("500"));
        await expect(
            primeo.connect(addr2).transferFrom(addr1.address, addr2.address, ethers.parseEther("600"))
        ).to.be.revertedWithoutReason()
    });

    it("Should allow the owner to update tokensPerEth", async function () {
        await primeo.updateTokensPerEth(ethers.parseEther("2000"));
        expect(await primeo.tokensPerEth()).to.equal(ethers.parseEther("2000"));
    });

    it("Should not allow non-owners to update tokensPerEth", async function () {
        await expect(
            primeo.connect(addr1).updateTokensPerEth(ethers.parseEther("2000"))
        ).to.be.revertedWithoutReason()
    });

    it("Should not allow non-owners to burn tokens", async function () {
        const amount = ethers.parseEther("1000");
        await primeo.adminClaimAirdrop(addr1.address, amount);

        await expect(
            primeo.connect(addr1).burn(ethers.parseEther("500"))
        ).to.be.revertedWithoutReason()
    });
});
