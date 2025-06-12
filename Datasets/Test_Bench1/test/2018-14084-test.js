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
        const [owner, buyer] = await ethers.getSigners();  // Verkrijg zowel eigenaar als koper

        // Stel de prijzen in voor de tokens
        await token.setPrices(ethers.parseEther("0.01"), ethers.parseEther("0.02"));

        // De koper koopt tokens
        await token.connect(buyer).buy({ value: ethers.parseEther("0.01") });

        // Controleer de balans van de koper (niet de eigenaar)
        const buyerBalance = await token.balanceOf(buyer.address);  // De koper ontvangt de tokens
        expect(buyerBalance).to.equal(ethers.parseEther("0")); // koper heeft net al zijn geld uitgegeven aan tokens
    });

});
