const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("UselessEthereumToken", function () {
    let UET, uet, owner, addr1, addr2;
    const finney = ethers.parseUnits("0.001", "ether");

    beforeEach(async function () {
        [owner, addr1, addr2] = await ethers.getSigners();
        const UETContract = await ethers.getContractFactory("contracts/2018-10468.sol:UselessEthereumToken");
        uet = await UETContract.deploy();
    });

    it("should deploy with the correct owner", async function () {
        expect(await uet.owner()).to.equal(owner.address);
    });

    it("should return the correct name, symbol, and decimals", async function () {
        expect(await uet.name()).to.equal("Useless Ethereum Token");
        expect(await uet.symbol()).to.equal("UET");
        expect(await uet.decimals()).to.equal(18);
    });

    it("should not allow transfers exceeding balance", async function () {
        // Save the initial balances
        const addr1BalanceBefore = await uet.balanceOf(addr1.address);
        const addr2BalanceBefore = await uet.balanceOf(addr2.address);

        // Try to transfer more tokens than addr1 has
        await uet.connect(addr1).transfer(addr2.address, 100);

        // Save the balances after the transfer attempt
        const addr1BalanceAfter = await uet.balanceOf(addr1.address);
        const addr2BalanceAfter = await uet.balanceOf(addr2.address);

        // Assert that the balances have not changed
        expect(addr1BalanceBefore).to.equal(addr1BalanceAfter);
        expect(addr2BalanceBefore).to.equal(addr2BalanceAfter);
    });

    it("should allow the owner to enable and disable purchasing", async function () {
        await uet.enablePurchasing();
        expect(await uet.purchasingAllowed()).to.be.true;

        await uet.disablePurchasing();
        expect(await uet.purchasingAllowed()).to.be.false;
    });

    it("should not allow non-owners to enable or disable purchasing", async function () {
        await expect(uet.connect(addr1).enablePurchasing()).to.be.reverted;
        await expect(uet.connect(addr1).disablePurchasing()).to.be.reverted;
    });

    it("Should approve tokens for spending", async function () {
        const approveAmount = ethers.parseUnits("100", 18);
        await uet.approve(addr1.address, approveAmount);
        expect(await uet.allowance(owner.address, addr1.address)).to.equal(approveAmount);
    });
});

