const { ethers } = require("hardhat");
const { expect } = require("chai");

describe("UselessEthereumToken", function () {
    let owner, addr1, addr2, uet;
    const finney = ethers.parseUnits("0.001", "ether");

    beforeEach(async function () {
        [owner, addr1, addr2] = await ethers.getSigners();

        const UET = await ethers.getContractFactory("contracts/2018-12025-3.sol:UselessEthereumToken");
        uet = await UET.deploy();
    });

    it("Should initialize UET with correct values", async function () {
        expect(await uet.name()).to.equal("Useless Ethereum Token");
        expect(await uet.symbol()).to.equal("UET");
        expect(await uet.decimals()).to.equal(18);
    });

    it("Should enable and disable purchasing", async function () {
        await uet.enablePurchasing();
        expect(await uet.purchasingAllowed()).to.be.true;
        await uet.disablePurchasing();
        expect(await uet.purchasingAllowed()).to.be.false;
    });

    it("Should handle transfer to the same account", async function () {
        const initialBalance = await uet.balanceOf(owner.address);
        await uet.transfer(owner.address, 0);
        expect(await uet.balanceOf(owner.address)).to.equal(initialBalance);
    });

    it("Should prevent non-owner from enabling purchasing", async function () {
        await expect(uet.connect(addr1).enablePurchasing()).to.be.reverted;
    });

    it("Should prevent non-owner from disabling purchasing", async function () {
        await expect(uet.connect(addr1).disablePurchasing()).to.be.reverted;
    });

    it("Should approve tokens for spending", async function () {
        const approveAmount = ethers.parseUnits("100", 18);
        await uet.approve(addr1.address, approveAmount);
        expect(await uet.allowance(owner.address, addr1.address)).to.equal(approveAmount);
    });
});