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

    it("Should not allow multiTransfer with more than 100 addresses", async function () {
        const addresses = Array(101).fill(addr1.address);
        const amounts = Array(101).fill(ethers.parseEther("1"));
        await expect(rocketCoin.multiTransfer(addresses, amounts)).to.be.reverted;
    });

    it("Should allow transferFrom if approved", async function () {
        await rocketCoin.approve(addr1.address, ethers.parseEther("500"));
        await rocketCoin.connect(addr1).transferFrom(owner.address, addr2.address, ethers.parseEther("100"));
        expect(await rocketCoin.balanceOf(addr2.address)).to.equal(ethers.parseEther("100"));
        expect(await rocketCoin.balanceOf(owner.address)).to.equal(ethers.parseEther("9999900"));
    });

    it("Should not allow transferFrom if not approved", async function () {
        await expect(rocketCoin.connect(addr1).transferFrom(owner.address, addr2.address, ethers.parseEther("100"))).to.be.reverted;
    });

    it("Should allow approve", async function () {
        await rocketCoin.approve(addr1.address, ethers.parseEther("500"));
        expect(await rocketCoin.allowance(owner.address, addr1.address)).to.equal(ethers.parseEther("500"));
    });

    it("Should not allow multiTransfer with zero addresses", async function () {
        const addresses = [];
        const amounts = [];
        await expect(rocketCoin.multiTransfer(addresses, amounts)).to.be.reverted;
    });

    it("Should not allow transfer of zero amount", async function () {
        await expect(rocketCoin.transfer(addr1.address, 0)).to.be.reverted;
    });

    it("Should not allow transferFrom of zero amount", async function () {
        await rocketCoin.approve(addr1.address, ethers.parseEther("500"));
        await expect(rocketCoin.connect(addr1).transferFrom(owner.address, addr2.address, 0)).to.be.reverted;
    });

    it("Should test the Approval event", async function () {
        await expect(rocketCoin.approve(addr1.address, ethers.parseEther("500")))
            .to.emit(rocketCoin, "Approval")
            .withArgs(owner.address, addr1.address, ethers.parseEther("500"));
    });

    it("Should test the Transfer event", async function () {
        await expect(rocketCoin.transfer(addr1.address, ethers.parseEther("100")))
            .to.emit(rocketCoin, "Transfer")
            .withArgs(owner.address, addr1.address, ethers.parseEther("100"));
    });
});
