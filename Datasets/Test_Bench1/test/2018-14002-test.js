const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MP3Coin", function () {
    let MP3Coin, mp3Coin, owner, addr1, addr2, addr3;

    beforeEach(async function () {
        [owner, addr1, addr2, addr3] = await ethers.getSigners();
        const MP3CoinFactory = await ethers.getContractFactory("MP3Coin");
        mp3Coin = await MP3CoinFactory.deploy();
    });

    it("Should initialize with correct values", async function () {
        expect(await mp3Coin.symbol()).to.equal("MP3");
        expect(await mp3Coin.name()).to.equal("MP3 Coin");
        expect(await mp3Coin.slogan()).to.equal("Make Music Great Again");
        expect(await mp3Coin.decimals()).to.equal(8);
        expect(await mp3Coin.totalSupply()).to.equal(ethers.parseEther("0.0001"));
        expect(await mp3Coin.balanceOf(owner.address)).to.equal(ethers.parseEther("0.0001"));
    });

    it("Should transfer tokens correctly", async function () {
        await mp3Coin.transfer(addr1.address, ethers.parseEther("0.00000001"));
        expect(await mp3Coin.balanceOf(owner.address)).to.equal(ethers.parseEther("0.0000999900"));
        expect(await mp3Coin.balanceOf(addr1.address)).to.equal(ethers.parseEther("0.00000001"));
    });

    it("Should fail transfer if balance is insufficient", async function () {
        await expect(mp3Coin.connect(addr1).transfer(addr2.address, ethers.parseEther("1"))).to.be.reverted;
    });

    it("Should approve and allow transferFrom correctly", async function () {
        await mp3Coin.approve(addr1.address, ethers.parseEther("0.000000005"));
        expect(await mp3Coin.allowance(owner.address, addr1.address)).to.equal(ethers.parseEther("0.000000005"));

        await mp3Coin.connect(addr1).transferFrom(owner.address, addr2.address, ethers.parseEther("0.000000005"));
        expect(await mp3Coin.balanceOf(owner.address)).to.equal(ethers.parseEther("0.0000999950"));
        expect(await mp3Coin.balanceOf(addr2.address)).to.equal(ethers.parseEther("0.000000005"));
    });

    it("Should fail transferFrom if allowance or balance is insufficient", async function () {
        await expect(mp3Coin.connect(addr1).transferFrom(owner.address, addr2.address, ethers.parseEther("1"))).to.be.reverted;

        await mp3Coin.approve(addr1.address, ethers.parseEther("50"));
        await expect(mp3Coin.connect(addr1).transferFrom(owner.address, addr2.address, ethers.parseEther("100"))).to.be.reverted;
    });

    it("Should distribute tokens correctly", async function () {
        const addresses = [addr1.address, addr2.address, addr3.address];
        const amounts = [ethers.parseEther("0.000000001"), ethers.parseEther("0.000000002"), ethers.parseEther("0.000000003")];

        await mp3Coin.distribute(addresses, amounts);

        expect(await mp3Coin.balanceOf(owner.address)).to.equal(ethers.parseEther("0.0000999940"));
        expect(await mp3Coin.balanceOf(addr1.address)).to.equal(ethers.parseEther("0.000000001"));
        expect(await mp3Coin.balanceOf(addr2.address)).to.equal(ethers.parseEther("0.000000002"));
        expect(await mp3Coin.balanceOf(addr3.address)).to.equal(ethers.parseEther("0.000000003"));
    });

    it("Should fail distribute if input lengths mismatch or insufficient balance", async function () {
        const addresses = [addr1.address, addr2.address];
        const amounts = [ethers.parseEther("10"), ethers.parseEther("20"), ethers.parseEther("30")];

        await expect(mp3Coin.distribute(addresses, amounts)).to.be.reverted;

        const largeAmounts = [ethers.parseEther("500000"), ethers.parseEther("500000"), ethers.parseEther("500000")];
        await expect(mp3Coin.distribute([addr1.address, addr2.address, addr3.address], largeAmounts)).to.be.reverted;
    });
});
