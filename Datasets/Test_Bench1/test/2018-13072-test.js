const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Coffeecoin Contract", function () {
    let owner, addr1, addr2, coffeecoin;

    beforeEach(async function () {
        [owner, addr1, addr2] = await ethers.getSigners();

        const Coffeecoin = await ethers.getContractFactory("Coffeecoin");
        coffeecoin = await Coffeecoin.deploy(
            ethers.parseEther("1000"), // initialSupply
            "Coffeecoin",             // tokenName
            18,                       // decimalUnits
            "CC"                      // tokenSymbol
        );
    });

    it("Should set the correct owner", async function () {
        expect(await coffeecoin.owner()).to.equal(owner.address);
    });

    it("Should transfer ownership", async function () {
        await coffeecoin.transferOwnership(addr1.address);
        expect(await coffeecoin.owner()).to.equal(addr1.address);
    });

    it("Should transfer tokens", async function () {
        await coffeecoin.transfer(addr1.address, ethers.parseEther("100"));
        expect(await coffeecoin.balanceOf(addr1.address)).to.equal(ethers.parseEther("100"));
    });

    it("Should not transfer tokens if sender balance is insufficient", async function () {
        await expect(
            coffeecoin.connect(addr1).transfer(addr2.address, ethers.parseEther("100"))
        ).to.be.reverted;
    });

    it("Should mint tokens", async function () {
        await coffeecoin.mintToken(addr1.address, ethers.parseEther("500"));
        expect(await coffeecoin.balanceOf(addr1.address)).to.equal(ethers.parseEther("500"));
    });

    it("Should freeze and unfreeze accounts", async function () {
        await coffeecoin.freezeAccount(addr1.address, true);
        expect(await coffeecoin.frozenAccount(addr1.address)).to.be.true;

        await expect(
            coffeecoin.connect(addr1).transfer(addr2.address, ethers.parseEther("100"))
        ).to.be.reverted;

        await coffeecoin.freezeAccount(addr1.address, false);
        expect(await coffeecoin.frozenAccount(addr1.address)).to.be.false;
    });

    it("Should set buy rate", async function () {
        await coffeecoin.setBuyRate(5000);
        expect(await coffeecoin.buyRate()).to.equal(5000);
    });

    it("Should enable and disable selling", async function () {
        await coffeecoin.setSelling(false);
        expect(await coffeecoin.isSelling()).to.be.false;

        await coffeecoin.setSelling(true);
        expect(await coffeecoin.isSelling()).to.be.true;
    });

    it("Should allow buying tokens", async function () {
        await coffeecoin.setSelling(true);
        await coffeecoin.connect(addr1).buy({ value: ethers.parseEther("1") });

        const expectedTokens = ethers.parseEther("1")*await coffeecoin.buyRate();
        expect(await coffeecoin.balanceOf(addr1.address)).to.equal(expectedTokens);
    });

    it("Should not allow buying tokens if selling is disabled", async function () {
        await coffeecoin.setSelling(false);
        await expect(
            coffeecoin.connect(addr1).buy({ value: ethers.parseEther("1") })
        ).to.be.reverted;
    });

    it("Should withdraw funds to owner", async function () {
        await coffeecoin.connect(addr1).buy({ value: ethers.parseEther("1") });

        const initialBalance = await ethers.provider.getBalance(owner.address);
        await coffeecoin.withdrawToOwner(ethers.parseEther("1"));
        const finalBalance = await ethers.provider.getBalance(owner.address);

        expect(finalBalance-initialBalance).to.be.closeTo(ethers.parseEther("1"), ethers.parseEther("0.001"));  //account for gasfluctuations
    });
});
