const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MyAdvancedToken", function () {
    let Token, token, owner, addr1, addr2;

    beforeEach(async function () {
        [owner, addr1, addr2, ...addrs] = await ethers.getSigners();
        Token = await ethers.getContractFactory("contracts/2018-14084.sol:MyAdvancedToken");
        token = await Token.deploy(
            ethers.parseEther("1000"), // initial supply
            "TestToken",
            "TTK"
        );
    });

    it("Should assign the total supply to the owner", async function () {
        const ownerBalance = await token.balanceOf(owner.address);
        expect(ownerBalance).to.equal(ethers.parseEther("1000000000000000000000"));
    });

    it("Should transfer tokens between accounts", async function () {
        await token.transfer(addr1.address, ethers.parseEther("100"));
        const addr1Balance = await token.balanceOf(addr1.address);
        expect(addr1Balance).to.equal(ethers.parseEther("100"));
    });

    it("Should fail if sender doesn’t have enough tokens", async function () {
        await expect(
            token.connect(addr1).transfer(addr2.address, ethers.parseEther("1"))
        ).to.be.revertedWithoutReason();
    });

    it("Should mint new tokens", async function () {
        await token.mintToken(addr1.address, ethers.parseEther("500"));
        const addr1Balance = await token.balanceOf(addr1.address);
        expect(addr1Balance).to.equal(ethers.parseEther("500"));
    });

    it("Should freeze and unfreeze accounts", async function () {
        await token.freezeAccount(addr1.address, true);
        await expect(
            token.connect(addr1).transfer(addr2.address, ethers.parseEther("1"))
        ).to.be.revertedWithoutReason();
        await token.freezeAccount(addr1.address, false);
        await token.transfer(addr1.address, ethers.parseEther("100"));
        await token.connect(addr1).transfer(addr2.address, ethers.parseEther("50"));
        const addr2Balance = await token.balanceOf(addr2.address);
        expect(addr2Balance).to.equal(ethers.parseEther("50"));
    });

    it("Should set buy and sell prices", async function () {
        await token.setPrices(ethers.parseEther("0.01"), ethers.parseEther("0.02"));
        const sellPrice = await token.sellPrice();
        const buyPrice = await token.buyPrice();
        expect(sellPrice).to.equal(ethers.parseEther("0.01"));
        expect(buyPrice).to.equal(ethers.parseEther("0.02"));
    });

    it("Should allow buying tokens", async function () {
        const [owner, buyer] = await ethers.getSigners();

        await token.setPrices(ethers.parseEther("0.01"), ethers.parseEther("0.02"));

        await token.connect(buyer).buy({ value: ethers.parseEther("0.01") });

        const buyerBalance = await token.balanceOf(buyer.address);
        expect(buyerBalance).to.equal(ethers.parseEther("0"));
    });

    it("Should receive ether via fallback function", async function () {
        const initialOwnerBalance = await ethers.provider.getBalance(owner.address);
        const amountToSend = ethers.parseEther("0.01");

        await owner.sendTransaction({
            to: await token.getAddress(),
            value: amountToSend
        });

        const finalOwnerBalance = await ethers.provider.getBalance(owner.address);
        expect(finalOwnerBalance).to.be.lt(initialOwnerBalance);
    });

    it("Should allow owner to destroy contract", async function () {
        const amountToSend = ethers.parseEther("1");
        await owner.sendTransaction({
            to: await token.getAddress(),
            value: amountToSend
        });

        const initialOwnerBalance = await ethers.provider.getBalance(owner.address);

        await token.selfdestructs();

        const finalOwnerBalance = await ethers.provider.getBalance(owner.address);
        expect(finalOwnerBalance).to.be.gt(initialOwnerBalance);
    });

    it("Should allow owner to withdraw ether", async function () {
        const amountToSend = ethers.parseEther("1");
        await owner.sendTransaction({
            to: await token.getAddress(),
            value: amountToSend
        });

        const initialOwnerBalance = await ethers.provider.getBalance(owner.address);

        await token.getEth(amountToSend);

        const finalOwnerBalance = await ethers.provider.getBalance(owner.address);
        expect(finalOwnerBalance).to.be.gt(initialOwnerBalance);
    });

    it("Should allow owner to set a new initial supply", async function () {
        const newInitialSupply = ethers.parseEther("2000");
        await token.newinitialSupply(newInitialSupply);
        const totalSupply = await token.totalSupply();
        expect(totalSupply).to.equal(newInitialSupply);
    });

    it("Should not allow transfers to the zero address", async function () {
        await expect(
            token.transfer("0x0000000000000000000000000000000000000000", ethers.parseEther("10"))
        ).to.be.reverted;
    });

    it("Should handle large token transfers", async function () {
        const largeAmount = ethers.parseEther("500");
        await token.transfer(addr1.address, largeAmount);
        const addr1Balance = await token.balanceOf(addr1.address);
        expect(addr1Balance).to.equal(largeAmount);
    });

    it("Should fail to mint tokens if not owner", async function () {
        await expect(
            token.connect(addr1).mintToken(addr2.address, ethers.parseEther("100"))
        ).to.be.reverted;
    });

    it("Should emit FrozenFunds event when freezing/unfreezing account", async function () {
        await expect(token.freezeAccount(addr1.address, true))
            .to.emit(token, "FrozenFunds")
            .withArgs(addr1.address, true);

        await expect(token.freezeAccount(addr1.address, false))
            .to.emit(token, "FrozenFunds")
            .withArgs(addr1.address, false);
    });

    it("Should not allow setting prices if not owner", async function () {
        await expect(
            token.connect(addr1).setPrices(ethers.parseEther("0.03"), ethers.parseEther("0.04"))
        ).to.be.reverted;
    });

    it("Should handle zero value buy", async function () {
        const [owner, buyer] = await ethers.getSigners();
        await token.setPrices(ethers.parseEther("0.01"), ethers.parseEther("0.02"));
        await token.connect(buyer).buy({ value: 0 });
        const buyerBalance = await token.balanceOf(buyer.address);
        expect(buyerBalance).to.equal(ethers.parseEther("0"));
    });

    it("Should not allow setting a new initial supply if not owner", async function () {
        const newInitialSupply = ethers.parseEther("3000");
        await expect(token.connect(addr1).newinitialSupply(newInitialSupply)).to.be.reverted;
    });
});
