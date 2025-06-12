const { ethers } = require("hardhat");
const { expect } = require("chai");

describe("2018-12025-3.sol", function () {
    let owner, addr1, addr2, uet;

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
});
