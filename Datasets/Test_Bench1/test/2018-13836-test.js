const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("RocketCoin Contract", function () {
    let RocketCoin, rocketCoin, owner, addr1, addr2, addr3;

    beforeEach(async function () {
        [owner, addr1, addr2, addr3] = await ethers.getSigners();
        const RocketCoinFactory = await ethers.getContractFactory("RocketCoin");
        rocketCoin = await RocketCoinFactory.deploy();
    });

    it("Should deploy with correct initial values", async function () {
        expect(await rocketCoin.symbol()).to.equal("XRC");
        expect(await rocketCoin.name()).to.equal("Rocket Coin");
        expect(await rocketCoin.decimals()).to.equal(18);
        expect(await rocketCoin.totalSupply()).to.equal(ethers.parseEther("10000000"));
        expect(await rocketCoin.balanceOf(owner.address)).to.equal(ethers.parseEther("10000000"));
    });

    it("Should allow transfers between accounts", async function () {
        await rocketCoin.transfer(addr1.address, ethers.parseEther("100"));
        expect(await rocketCoin.balanceOf(addr1.address)).to.equal(ethers.parseEther("100"));
        expect(await rocketCoin.balanceOf(owner.address)).to.equal(ethers.parseEther("9999900"));
    });

    it("Should not allow transfers with insufficient balance", async function () {
        await expect(rocketCoin.connect(addr1).transfer(addr2.address, ethers.parseEther("100"))).to.be.reverted;
    });

    it("Should allow multiTransfer to multiple addresses", async function () {
        const addresses = [addr1.address, addr2.address];
        const amounts = [ethers.parseEther("50"), ethers.parseEther("50")];
        await rocketCoin.multiTransfer(addresses, amounts);
        expect(await rocketCoin.balanceOf(addr1.address)).to.equal(ethers.parseEther("50"));
        expect(await rocketCoin.balanceOf(addr2.address)).to.equal(ethers.parseEther("50"));
        expect(await rocketCoin.balanceOf(owner.address)).to.equal(ethers.parseEther("9999900"));
    });

    it("Should not allow multiTransfer with mismatched arrays", async function () {
        const addresses = [addr1.address];
        const amounts = [ethers.parseEther("50"), ethers.parseEther("50")];
        await expect(rocketCoin.multiTransfer(addresses, amounts)).to.be.reverted;
    });

    it("Should not allow non-owner to call owner-specific functions", async function () {
        await expect(rocketCoin.connect(addr1).setupAirDrop(true, 300, 20)).to.be.reverted;
        await expect(rocketCoin.connect(addr1).withdrawFunds("0x0000000000000000000000000000000000000000")).to.be.reverted;
    });
});
