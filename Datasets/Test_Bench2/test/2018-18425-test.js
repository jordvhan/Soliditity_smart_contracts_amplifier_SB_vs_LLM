const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Primeo Contract", function () {
    let Primeo, primeo, owner, addr1, addr2, addrs;

    beforeEach(async function () {
        [owner, addr1, addr2, ...addrs] = await ethers.getSigners();
        Primeo = await ethers.getContractFactory("Primeo");
        primeo = await Primeo.deploy();
    });

    it("Should distribute tokens correctly", async function () {
        const amount = ethers.parseEther("1000");
        await primeo.adminClaimAirdrop(addr1.address, amount);
        expect(await primeo.balanceOf(addr1.address)).to.equal(amount);

        // Optionally, transfer the tokens back to the owner for subsequent tests
        await primeo.connect(addr1).transfer(owner.address, amount);
    });

    it("Should allow token transfers", async function () {
        const amount = ethers.parseEther("1000");
        await primeo.adminClaimAirdrop(addr1.address, amount);

        await primeo.connect(addr1).transfer(addr2.address, ethers.parseEther("500"));
        expect(await primeo.balanceOf(addr1.address)).to.equal(ethers.parseEther("500"));
        expect(await primeo.balanceOf(addr2.address)).to.equal(ethers.parseEther("500"));

        // Transfer tokens back to addr1 for subsequent tests
        await primeo.connect(addr2).transfer(addr1.address, ethers.parseEther("500"));
    });

    it("Should not allow transfers exceeding balance", async function () {
        const amount = ethers.parseEther("1000");
        await primeo.adminClaimAirdrop(addr1.address, amount);

        await expect(
            primeo.connect(addr1).transfer(addr2.address, ethers.parseEther("1500"))
        ).to.be.revertedWithoutReason()
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

        // Reset tokensPerEth for subsequent tests
        await primeo.updateTokensPerEth(ethers.parseEther("10000000000"));
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

    it("Should transfer ownership and enforce onlyOwner restrictions", async function () {
        await primeo.transferOwnership(addr1.address);
        await primeo.connect(addr1).updateTokensPerEth(ethers.parseEther("2000"));
        expect(await primeo.tokensPerEth()).to.equal(ethers.parseEther("2000"));
        await expect(
            primeo.updateTokensPerEth(ethers.parseEther("3000"))
        ).to.be.reverted;

        // Transfer ownership back to the original owner for subsequent tests
        await primeo.connect(addr1).transferOwnership(owner.address);
    });

    it("Should not allow burning tokens more than balance", async function () {
        await expect(
            primeo.burn(ethers.parseEther("100"))
        ).to.be.reverted;
    });

    it("Should allow the owner to update tokensPerEth", async function () {
        const newRate = ethers.parseEther("2000");
        await primeo.updateTokensPerEth(newRate);
        expect(await primeo.tokensPerEth()).to.equal(newRate);
    });

    it("Should allow the owner to finish distribution", async function () {
        expect(await primeo.distributionFinished()).to.be.false;
        await primeo.finishDistribution();
        expect(await primeo.distributionFinished()).to.be.true;
    });

    it("Should revert if non-owner tries to withdraw Ether", async function () {
        await expect(primeo.connect(addr1).withdraw()).to.be.reverted;
    });


    it("Should handle adminClaimAirdropMultiple with empty array", async function () {
        await primeo.adminClaimAirdropMultiple([], ethers.parseEther("1000"));
    });

    it("Should revert if trying to burn tokens when the burner has zero balance", async function () {
        await expect(primeo.burn(ethers.parseEther("100"))).to.be.reverted;
    });

    it("Should revert transfer to the zero address", async function () {
        const amount = ethers.parseEther("1000");
        await primeo.adminClaimAirdrop(addr1.address, amount);
        await expect(primeo.connect(addr1).transfer(ethers.ZeroAddress, ethers.parseEther("500"))).to.be.reverted;
    });

    it("Should revert transferFrom to the zero address", async function () {
        const amount = ethers.parseEther("1000");
        await primeo.adminClaimAirdrop(addr1.address, amount);
        await primeo.connect(addr1).approve(addr2.address, ethers.parseEther("500"));
        await expect(primeo.connect(addr2).transferFrom(addr1.address, ethers.ZeroAddress, ethers.parseEther("500"))).to.be.reverted;
    });

    it("Should handle transfer of zero amount", async function () {
        const amount = ethers.parseEther("1000");
        await primeo.adminClaimAirdrop(addr1.address, amount);
        await primeo.connect(addr1).transfer(addr2.address, 0);
        expect(await primeo.balanceOf(addr1.address)).to.equal(amount);
        expect(await primeo.balanceOf(addr2.address)).to.equal(0);
    });

    it("Should handle transferFrom of zero amount", async function () {
        const amount = ethers.parseEther("1000");
        await primeo.adminClaimAirdrop(addr1.address, amount);
        await primeo.connect(addr1).approve(addr2.address, ethers.parseEther("500"));
        await primeo.connect(addr2).transferFrom(addr1.address, addr2.address, 0);
        expect(await primeo.balanceOf(addr1.address)).to.equal(amount);
        expect(await primeo.balanceOf(addr2.address)).to.equal(0);
    });

    it("Should handle approving zero amount", async function () {
        await primeo.connect(addr1).approve(addr2.address, 0);
        expect(await primeo.allowance(addr1.address, addr2.address)).to.equal(0);
    });

    it("Should handle burning zero tokens", async function () {
        const initialTotalSupply = await primeo.totalSupply();
        await primeo.adminClaimAirdrop(addr1.address, ethers.parseEther("200"));
        await primeo.burn(0);
        expect(await primeo.totalSupply()).to.equal(initialTotalSupply);
    });
});
