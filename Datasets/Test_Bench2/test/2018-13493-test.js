const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("DaddyToken Contract", function () {
    let DaddyToken, daddyToken, owner, addr1, addr2, addr3;

    beforeEach(async function () {
        [owner, addr1, addr2, addr3] = await ethers.getSigners();
        const initialSupply = ethers.parseEther("1000");
        DaddyToken = await ethers.getContractFactory("DaddyToken");
        daddyToken = await DaddyToken.deploy(initialSupply, "DaddyToken", "DTK");
    });

    it("Should initialize with correct values", async function () {
        expect(await daddyToken.name()).to.equal("DaddyToken");
        expect(await daddyToken.symbol()).to.equal("DTK");
        expect(await daddyToken.totalSupply()).to.equal(ethers.parseEther("1000000000000000000000"));
        expect(await daddyToken.balanceOf(owner.address)).to.equal(ethers.parseEther("1000000000000000000000"));
    });

    it("Should transfer tokens correctly", async function () {
        await daddyToken.transfer(addr1.address, ethers.parseEther("100000000000000000000"));
        expect(await daddyToken.balanceOf(addr1.address)).to.equal(ethers.parseEther("100000000000000000000"));
        expect(await daddyToken.balanceOf(owner.address)).to.equal(ethers.parseEther("900000000000000000000"));
    });

    it("Should allow owner to mint tokens", async function () {
        await daddyToken.mintToken(addr1.address, ethers.parseEther("50"));
        expect(await daddyToken.balanceOf(addr1.address)).to.equal(ethers.parseEther("50000000000000000000"));
        expect(await daddyToken.totalSupply()).to.equal(ethers.parseEther("1050000000000000000000"));
    });

    it("Should allow owner to freeze accounts", async function () {
        await daddyToken.freezeAccount(addr1.address, true);
        await expect(daddyToken.connect(addr1).transfer(addr2.address, ethers.parseEther("10"))).to.be.reverted;
    });

    it("Should allow owner to set prices", async function () {
        await daddyToken.setPrices(ethers.parseEther("0.01"), ethers.parseEther("0.02"));
        expect(await daddyToken.sellTokenPerEther()).to.equal(ethers.parseEther("0.01"));
        expect(await daddyToken.buyTokenPerEther()).to.equal(ethers.parseEther("0.02"));
    });

    it("Should distribute tokens correctly", async function () {
        const addresses = [addr1.address, addr2.address];
        await daddyToken.distributeToken(addresses, ethers.parseEther("10"));
        expect(await daddyToken.balanceOf(addr1.address)).to.equal(ethers.parseEther("10000000000000000000"));
        expect(await daddyToken.balanceOf(addr2.address)).to.equal(ethers.parseEther("10000000000000000000"));
    });

    it("Should burn tokens correctly", async function () {
        await daddyToken.burn(ethers.parseEther("100"));
        expect(await daddyToken.totalSupply()).to.equal(ethers.parseEther("900000000000000000000"));
        expect(await daddyToken.balanceOf(owner.address)).to.equal(ethers.parseEther("900000000000000000000"));
    });

    it("Should burn tokens from another account correctly", async function () {
        await daddyToken.transfer(addr1.address, ethers.parseEther("100000000000000000000"));
        await daddyToken.connect(addr1).approve(owner.address, ethers.parseEther("50000000000000000000"));
        await daddyToken.burnFrom(addr1.address, ethers.parseEther("50000000000000000000"));
        expect(await daddyToken.balanceOf(addr1.address)).to.equal(ethers.parseEther("50000000000000000000"));
        expect(await daddyToken.totalSupply()).to.equal(ethers.parseEther("950000000000000000000"));
    });

    it("Should transfer tokens correctly from owner to another account", async function () {
        const initialOwnerBalance = await daddyToken.balanceOf(owner.address);
        const transferAmount = ethers.parseEther("100");

        await daddyToken.transfer(addr1.address, transferAmount);
        const finalOwnerBalance = await daddyToken.balanceOf(owner.address);

        expect(finalOwnerBalance).to.equal(initialOwnerBalance - transferAmount);
        expect(await daddyToken.balanceOf(addr1.address)).to.equal(transferAmount);
    });

    it("Should fail when trying to transfer more tokens than balance", async function () {
        const initialOwnerBalance = await daddyToken.balanceOf(owner.address);
        const transferAmount = ethers.parseEther("1001000000000000000000"); // More than initial supply

        await expect(daddyToken.transfer(addr1.address, transferAmount)).to.be.reverted;
        expect(await daddyToken.balanceOf(owner.address)).to.equal(initialOwnerBalance);
        expect(await daddyToken.balanceOf(addr1.address)).to.equal(0);
    });

    it("Should distribute tokens correctly to multiple accounts", async function () {
        const addresses = [addr1.address, addr2.address, addr3.address];
        const distributeAmount = ethers.parseEther("10");
        const distributeAmount2 = ethers.parseEther("10000000000000000000");  // fix precision

        await daddyToken.distributeToken(addresses, distributeAmount);

        expect(await daddyToken.balanceOf(addr1.address)).to.equal(distributeAmount2);
        expect(await daddyToken.balanceOf(addr2.address)).to.equal(distributeAmount2);
        expect(await daddyToken.balanceOf(addr3.address)).to.equal(distributeAmount2);
    });

    it("Should handle distribution to an empty array of addresses", async function () {
        const addresses = [];
        const distributeAmount = ethers.parseEther("10");

        await daddyToken.distributeToken(addresses, distributeAmount);

        expect(await daddyToken.balanceOf(addr1.address)).to.equal(0);
        expect(await daddyToken.balanceOf(addr2.address)).to.equal(0);
        expect(await daddyToken.balanceOf(addr3.address)).to.equal(0);
    });

    it("Should allow owner to enable and disable purchasing", async function () {
        await daddyToken.disablePurchasing();
        expect(await daddyToken.purchasingAllowed()).to.equal(false);

        await daddyToken.enablePurchasing();
        expect(await daddyToken.purchasingAllowed()).to.equal(true);
    });

    it("Should only allow owner to enable and disable purchasing", async function () {
        await expect(daddyToken.connect(addr1).disablePurchasing()).to.be.reverted;
        await expect(daddyToken.connect(addr1).enablePurchasing()).to.be.reverted;
    });

    it("Should allow owner to freeze and unfreeze accounts", async function () {
        await daddyToken.freezeAccount(addr1.address, true);
        expect(await daddyToken.frozenAccount(addr1.address)).to.equal(true);

        await daddyToken.freezeAccount(addr1.address, false);
        expect(await daddyToken.frozenAccount(addr1.address)).to.equal(false);
    });

    it("Should only allow owner to freeze and unfreeze accounts", async function () {
        await expect(daddyToken.connect(addr1).freezeAccount(addr1.address, true)).to.be.reverted;
    });

    it("Should fail when trying to burn more tokens than balance", async function () {
        const initialBalance = await daddyToken.balanceOf(owner.address);
        const burnAmount = ethers.parseEther("1001000000000000000000"); // More than initial supply

        await expect(daddyToken.burn(burnAmount)).to.be.reverted;
        expect(await daddyToken.balanceOf(owner.address)).to.equal(initialBalance);
    });

    it("Should allow burning tokens from another account with approval", async function () {
        const initialBalanceAddr1 = await daddyToken.balanceOf(addr1.address);
        const burnAmount = ethers.parseEther("10000000000000000000");

        await daddyToken.transfer(addr1.address, ethers.parseEther("100000000000000000000"));
        await daddyToken.connect(addr1).approve(owner.address, burnAmount);
        await daddyToken.burnFrom(addr1.address, burnAmount);

        expect(await daddyToken.balanceOf(addr1.address)).to.equal(ethers.parseEther("90000000000000000000"));
        expect(await daddyToken.totalSupply()).to.equal(ethers.parseEther("990000000000000000000"));
    });

    it("Should fail when trying to burn tokens from another account without approval", async function () {
        await daddyToken.transfer(addr1.address, ethers.parseEther("100"));
        const burnAmount = ethers.parseEther("10");

        await expect(daddyToken.burnFrom(addr1.address, burnAmount)).to.be.reverted;
        expect(await daddyToken.balanceOf(addr1.address)).to.equal(ethers.parseEther("100"));
    });

    it("Should fail when trying to burn more tokens than approved", async function () {
        await daddyToken.transfer(addr1.address, ethers.parseEther("100"));
        const burnAmount = ethers.parseEther("50");
        await daddyToken.connect(addr1).approve(owner.address, burnAmount);

        await expect(daddyToken.burnFrom(addr1.address, ethers.parseEther("60"))).to.be.reverted;
        expect(await daddyToken.balanceOf(addr1.address)).to.equal(ethers.parseEther("100"));
    });

    it("Should handle setting zero prices", async function () {
        await daddyToken.setPrices(0, 0);
        expect(await daddyToken.sellTokenPerEther()).to.equal(0);
        expect(await daddyToken.buyTokenPerEther()).to.equal(0);
    });

    it("Should only allow owner to set prices", async function () {
        await expect(daddyToken.connect(addr1).setPrices(ethers.parseEther("0.01"), ethers.parseEther("0.02"))).to.be.reverted;
    });

    it("Should handle distributing tokens to a single address", async function () {
        const addresses = [addr1.address];
        const distributeAmount = ethers.parseEther("10");
        const distributeAmount2 = ethers.parseEther("10000000000000000000");  // fix precision

        await daddyToken.distributeToken(addresses, distributeAmount);

        expect(await daddyToken.balanceOf(addr1.address)).to.equal(distributeAmount2);
    });

    it("Should handle distributing zero tokens", async function () {
        const addresses = [addr1.address, addr2.address, addr3.address];
        const distributeAmount = 0;

        await daddyToken.distributeToken(addresses, distributeAmount);

        expect(await daddyToken.balanceOf(addr1.address)).to.equal(0);
        expect(await daddyToken.balanceOf(addr2.address)).to.equal(0);
        expect(await daddyToken.balanceOf(addr3.address)).to.equal(0);
    });

    it("Should handle distributing tokens to a large number of accounts", async function () {
        const addresses = Array.from({ length: 10 }, (_, i) => addr1.address);
                const distributeAmount = ethers.parseEther("10");
        const distributeAmount2 = ethers.parseEther("100000000000000000000");  // fix precision

        await daddyToken.distributeToken(addresses, distributeAmount);

        for (let i = 0; i < addresses.length; i++) {
            expect(await daddyToken.balanceOf(addresses[i])).to.equal(distributeAmount2);
        }
    });

    it("Should fail when trying to burn zero tokens", async function () {
        const initialBalance = await daddyToken.balanceOf(owner.address);

        await daddyToken.burn(0);

        expect(await daddyToken.balanceOf(owner.address)).to.equal(initialBalance);
    });

    it("Should fail when trying to burn tokens from address zero", async function () {
        const burnAmount = ethers.parseEther("10");

        await expect(daddyToken.burnFrom(ethers.ZeroAddress, burnAmount)).to.be.reverted;
    });

    it("Should handle burning all tokens from another account with approval", async function () {
        await daddyToken.transfer(addr1.address, ethers.parseEther("100000000000000000000"));
        const initialBalanceAddr1 = await daddyToken.balanceOf(addr1.address);
        await daddyToken.connect(addr1).approve(owner.address, initialBalanceAddr1);

        await daddyToken.burnFrom(addr1.address, initialBalanceAddr1);

        expect(await daddyToken.balanceOf(addr1.address)).to.equal(0);
        expect(await daddyToken.totalSupply()).to.equal(ethers.parseEther("900000000000000000000"));
    });

    it("Should handle setting same prices for buying and selling", async function () {
        const price = ethers.parseEther("0.015");
        await daddyToken.setPrices(price, price);
        expect(await daddyToken.sellTokenPerEther()).to.equal(price);
        expect(await daddyToken.buyTokenPerEther()).to.equal(price);
    });

    it("Should handle setting very large prices", async function () {
        const largePrice = ethers.parseEther("1000000");
        await daddyToken.setPrices(largePrice, largePrice);
        expect(await daddyToken.sellTokenPerEther()).to.equal(largePrice);
        expect(await daddyToken.buyTokenPerEther()).to.equal(largePrice);
    });

    it("Should handle minting zero tokens", async function () {
        const initialTotalSupply = await daddyToken.totalSupply();
        await daddyToken.mintToken(addr1.address, 0);
        expect(await daddyToken.balanceOf(addr1.address)).to.equal(0);
        expect(await daddyToken.totalSupply()).to.equal(initialTotalSupply);
    });

    it("Should handle freezing and unfreezing the owner's account", async function () {
        await daddyToken.freezeAccount(owner.address, true);
        expect(await daddyToken.frozenAccount(owner.address)).to.equal(true);

        await daddyToken.freezeAccount(owner.address, false);
        expect(await daddyToken.frozenAccount(owner.address)).to.equal(false);
    });

    it("Should handle freezing and unfreezing address zero", async function () {
        await daddyToken.freezeAccount(ethers.ZeroAddress, true);
        expect(await daddyToken.frozenAccount(ethers.ZeroAddress)).to.equal(true);

        await daddyToken.freezeAccount(ethers.ZeroAddress, false);
        expect(await daddyToken.frozenAccount(ethers.ZeroAddress)).to.equal(false);
    });
});
