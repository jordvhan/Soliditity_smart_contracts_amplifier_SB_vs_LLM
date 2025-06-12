const { expect } = require("chai");
const { ethers } = require("hardhat");
const {parseEther} = require("ethers");

describe("EnterCoin Legacy Contract", function () {
    let enterCoin, owner, addr1, addr2;

    beforeEach(async function () {
        [owner, addr1, addr2] = await ethers.getSigners();
        const EnterCoinFactory = await ethers.getContractFactory("EnterCoin");
        enterCoin = await EnterCoinFactory.deploy();
    });

    it("Should deploy with correct total supply and assign to owner", async function () {
        const totalSupply = await enterCoin.totalSupply();
        const ownerBalance = await enterCoin.balanceOf(owner.address);
        expect(ownerBalance).to.equal(totalSupply);
    });

    it("Should transfer tokens", async function () {
        await enterCoin.transfer(addr1.address, 1000);
        expect(await enterCoin.balanceOf(addr1.address)).to.equal(1000);
    });

    it("Should fail if sender has insufficient tokens", async function () {
        await expect(
            enterCoin.connect(addr1).transfer(addr2.address, 1000)
        ).to.be.reverted;
    });

    it("Should allow owner to mint tokens", async function () {
        const amount = 5000;
        const oldTotal = await enterCoin.totalSupply();
        await enterCoin.mintToken(addr1.address, amount);
        expect(await enterCoin.balanceOf(addr1.address)).to.equal(amount);
        expect(await enterCoin.totalSupply()).to.equal(oldTotal+ethers.parseUnits(amount.toString(), "wei"));
    });

    it("Should allow owner to freeze and unfreeze accounts", async function () {
        await enterCoin.freezeAccount(addr1.address, true);
        expect(await enterCoin.frozenAccount(addr1.address)).to.equal(true);

        await enterCoin.transfer(addr1.address, 1000);

        await expect(
            enterCoin.connect(addr1).transfer(addr2.address, 500)
        ).to.be.reverted;

        await enterCoin.freezeAccount(addr1.address, false);
        await enterCoin.connect(addr1).transfer(addr2.address, 500);
        expect(await enterCoin.balanceOf(addr2.address)).to.equal(500);
    });

    it("Should allow setting prices", async function () {
        await enterCoin.setPrices(100, 200);
        expect(await enterCoin.sellPrice()).to.equal(100);
        expect(await enterCoin.buyPrice()).to.equal(200);
    });

    it("Should allow buying tokens", async function () {
        const buyPrice = ethers.parseUnits("1", "wei");
        await enterCoin.setPrices(0, buyPrice);

        const tokenAmount = 1000;
        await enterCoin.transfer(enterCoin.target, tokenAmount); // fund het contract zelf met tokens

        const valueToSend = 100; // koopt 100 tokens bij prijs van 1 wei per stuk

        await enterCoin.connect(addr1).buy({ value: valueToSend });

        expect(await enterCoin.balanceOf(addr1.address)).to.equal(valueToSend);
    });

    it("Should revert buying if contract has no tokens", async function () {
        await enterCoin.setPrices(100, ethers.parseUnits("1", "wei"));

        await expect(
            enterCoin.connect(addr1).buy({ value: 1000 })
        ).to.be.reverted;
    });

    it("Should revert selling if user has insufficient tokens", async function () {
        await enterCoin.setPrices(ethers.parseUnits("1", "wei"), 1);
        await expect(enterCoin.connect(addr1).sell(1000)).to.be.reverted;
    });

    it("Should allow approve and transferFrom", async function () {
        await enterCoin.approve(addr1.address, 500);
        expect(await enterCoin.allowance(owner.address, addr1.address)).to.equal(500);
        await enterCoin.connect(addr1).transferFrom(owner.address, addr2.address, 250);
        expect(await enterCoin.balanceOf(addr2.address)).to.equal(250);
        expect(await enterCoin.balanceOf(owner.address)).to.equal(ethers.getBigInt(2099999999999750));
    });

    it("Should revert transferFrom if allowance is not enough", async function () {
        await enterCoin.approve(addr1.address, 100);
        await expect(enterCoin.connect(addr1).transferFrom(owner.address, addr2.address, 500)).to.be.reverted;
    });

    it("Should revert selling if contract has no ether", async function () {
        await enterCoin.transfer(addr1.address, 1000);
        await enterCoin.setPrices(ethers.parseUnits("1", "ether"), 0);
        await expect(enterCoin.connect(addr1).sell(500)).to.be.reverted;
    });
});
