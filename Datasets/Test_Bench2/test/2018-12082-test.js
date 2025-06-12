const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("FujintoToken Contract", function () {
    let FujintoToken, token, owner, addr1, addr2, addrs;

    beforeEach(async function () {
        [owner, addr1, addr2, ...addrs] = await ethers.getSigners();
        const initialSupply = ethers.parseEther("1000");
        FujintoToken = await ethers.getContractFactory("FujintoToken");
        token = await FujintoToken.deploy(initialSupply, "Fujinto", 18, "FUJ");
    });

    it("Should deploy with correct initial supply", async function () {
        const totalSupply = await token.totalSupply();
        expect(totalSupply).to.equal(ethers.parseEther("1000"));
        const ownerBalance = await token.balanceOf(owner.address);
        expect(ownerBalance).to.equal(ethers.parseEther("1000"));
    });

    it("Should transfer tokens between accounts", async function () {
        await token.transfer(addr1.address, ethers.parseEther("100"));
        const addr1Balance = await token.balanceOf(addr1.address);
        expect(addr1Balance).to.equal(ethers.parseEther("100"));
    });

    it("Should fail if sender doesn’t have enough tokens", async function () {
        await expect(
            token.connect(addr1).transfer(addr2.address, ethers.parseEther("1"))
        ).to.be.reverted;
    });

    it("Should allow owner to mint tokens", async function () {
        await token.mintToken(addr1.address, ethers.parseEther("500"));
        const addr1Balance = await token.balanceOf(addr1.address);
        expect(addr1Balance).to.equal(ethers.parseEther("500"));
    });

    it("Should freeze and unfreeze accounts", async function () {
        await token.freezeAccount(owner.address, true);
        await expect(
            token.connect(owner).transfer(addr2.address, ethers.parseEther("1"))
        ).to.be.reverted;

        await token.freezeAccount(owner.address, false);
        await token.connect(owner).transfer(addr2.address, ethers.parseEther("1"));
    });

    it("Should allow buying tokens", async function () {
        await token.setSelling(true);
        await token.connect(addr1).buy({ value: ethers.parseEther("1") });
        const addr1Balance = await token.balanceOf(addr1.address);
        expect(addr1Balance).to.equal(ethers.parseEther("4000")); // buyRate = 4000
    });

    it("Should allow owner to withdraw funds", async function () {
        const initialOwnerBalance = await ethers.provider.getBalance(owner.address);
        await token.connect(addr1).buy({ value: ethers.parseEther("1") });
        await token.withdrawToOwner(ethers.parseEther("1"));
        const finalOwnerBalance = await ethers.provider.getBalance(owner.address);
        expect(finalOwnerBalance).to.be.above(initialOwnerBalance);
    });

    it("Should update buy rate and selling status", async function () {
        await token.setBuyRate(5000);
        const newBuyRate = await token.buyRate();
        expect(newBuyRate).to.equal(5000);

        await token.setSelling(false);
        const sellingStatus = await token.isSelling();
        expect(sellingStatus).to.be.false;
    });

    it("Should prevent buying tokens when selling is disabled", async function () {
        await token.setSelling(false);
        await expect(
            token.connect(addr1).buy({ value: ethers.parseEther("1") })
        ).to.be.reverted;
    });

    it("Should transfer ownership", async function () {
        await token.transferOwnership(addr1.address);
        expect(await token.owner()).to.equal(addr1.address);
    });

    it("Should fail transfer ownership from non-owner", async function () {
        await expect(
            token.connect(addr1).transferOwnership(addr2.address)
        ).to.be.reverted;
    });

    it("Should fail to mint tokens from non-owner", async function () {
        await expect(
            token.connect(addr1).mintToken(addr2.address, ethers.parseEther("100"))
        ).to.be.reverted;
    });

    it("Should fail to freeze account from non-owner", async function () {
        await expect(
            token.connect(addr1).freezeAccount(addr2.address, true)
        ).to.be.reverted;
    });

    it("Should fail to set buy rate from non-owner", async function () {
        await expect(
            token.connect(addr1).setBuyRate(5000)
        ).to.be.reverted;
    });

    it("Should fail to set selling status from non-owner", async function () {
        await expect(
            token.connect(addr1).setSelling(false)
        ).to.be.reverted;
    });

    it("Should fail to withdraw funds from non-owner", async function () {
        await expect(
            token.connect(addr1).withdrawToOwner(ethers.parseEther("1"))
        ).to.be.reverted;
    });

    it("Should transfer tokens to zero address", async function () {
        await expect(
            token.transfer(ethers.ZeroAddress, ethers.parseEther("100"))
        ).to.be.ok;
    });

    it("Should transferFrom tokens", async function () {
        await token.approve(addr1.address, ethers.parseEther("100"));
        await token.connect(addr1).transferFrom(owner.address, addr2.address, ethers.parseEther("50"));
        expect(await token.balanceOf(addr2.address)).to.equal(ethers.parseEther("50"));
    });

    it("Should fail transferFrom tokens due to insufficient allowance", async function () {
        await token.approve(addr1.address, ethers.parseEther("10"));
        await expect(
            token.connect(addr1).transferFrom(owner.address, addr2.address, ethers.parseEther("50"))
        ).to.be.reverted;
    });

    it("Should fail transferFrom tokens due to frozen account", async function () {
        await token.freezeAccount(owner.address, true);
        await token.approve(addr1.address, ethers.parseEther("100"));
        await expect(
            token.connect(addr1).transferFrom(owner.address, addr2.address, ethers.parseEther("50"))
        ).to.be.reverted;
    });

    it("Should fail transfer tokens when account is frozen", async function () {
        await token.freezeAccount(addr1.address, true);
        await expect(
            token.connect(addr1).transfer(addr2.address, ethers.parseEther("10"))
        ).to.be.reverted;
    });

    it("Should handle transfer to self", async function () {
        const initialBalance = await token.balanceOf(owner.address);
        await token.transfer(owner.address, ethers.parseEther("10"));
        expect(await token.balanceOf(owner.address)).to.equal(initialBalance);
    });

    it("Should handle transferFrom to self", async function () {
        await token.approve(addr1.address, ethers.parseEther("100"));
        const initialBalance = await token.balanceOf(owner.address);
        await token.connect(addr1).transferFrom(owner.address, owner.address, ethers.parseEther("50"));
        expect(await token.balanceOf(owner.address)).to.equal(initialBalance);
    });

    it("Should handle buying tokens with zero value", async function () {
        await token.setSelling(true);
        const initialBalance = await token.balanceOf(addr1.address);
        await token.connect(addr1).buy({ value: ethers.parseEther("0") });
        expect(await token.balanceOf(addr1.address)).to.equal(initialBalance);
    });

    it("Should handle setting the same buy rate", async function () {
        const initialBuyRate = await token.buyRate();
        await token.setBuyRate(initialBuyRate);
        expect(await token.buyRate()).to.equal(initialBuyRate);
    });

    it("Should handle setting the same selling status", async function () {
        const initialSellingStatus = await token.isSelling();
        await token.setSelling(initialSellingStatus);
        expect(await token.isSelling()).to.equal(initialSellingStatus);
    });

    it("Should handle transfer ownership to the same owner", async function () {
        const initialOwner = await token.owner();
        await token.transferOwnership(initialOwner);
        expect(await token.owner()).to.equal(initialOwner);
    });

    it("Should handle minting zero tokens", async function () {
        const initialTotalSupply = await token.totalSupply();
        await token.mintToken(addr1.address, ethers.parseEther("0"));
        expect(await token.totalSupply()).to.equal(initialTotalSupply);
    });

    it("Should handle freezing and unfreezing the same account", async function () {
        await token.freezeAccount(addr1.address, true);
        await token.freezeAccount(addr1.address, true);
        expect(await token.frozenAccount(addr1.address)).to.equal(true);

        await token.freezeAccount(addr1.address, false);
        await token.freezeAccount(addr1.address, false);
        expect(await token.frozenAccount(addr1.address)).to.equal(false);
    });

    it("Should handle transferFrom with zero value", async function () {
        await token.approve(addr1.address, ethers.parseEther("100"));
        const initialBalanceAddr1 = await token.balanceOf(addr1.address);
        await token.connect(addr1).transferFrom(owner.address, addr1.address, ethers.parseEther("0"));
        expect(await token.balanceOf(addr1.address)).to.equal(initialBalanceAddr1);
    });

    it("Should handle transfer with zero value", async function () {
        const initialBalanceAddr1 = await token.balanceOf(addr1.address);
        await token.transfer(addr1.address, ethers.parseEther("0"));
        expect(await token.balanceOf(addr1.address)).to.equal(initialBalanceAddr1);
    });
});
