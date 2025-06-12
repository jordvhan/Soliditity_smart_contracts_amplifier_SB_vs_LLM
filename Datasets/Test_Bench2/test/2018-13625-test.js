const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Krown Contract", function () {
    let Krown, krown, owner, addr1, addr2;
    const initialSupply = ethers.parseEther("1000");

    beforeEach(async function () {
        [owner, addr1, addr2] = await ethers.getSigners();
        Krown = await ethers.getContractFactory("Krown");
        krown = await Krown.deploy(initialSupply, "KrownToken", 18, "KT", owner.address);
    });

    it("Should set the correct initial supply and owner", async function () {
        expect(await krown.totalSupply()).to.equal(ethers.parseEther("1000"));
        expect(await krown.centralAuthority()).to.equal(owner.address);
    });

    it("Should transfer tokens between accounts", async function () {
        await krown.transfer(addr1.address, ethers.parseEther("100"));
        expect(await krown.balanceOf(addr1.address)).to.equal(ethers.parseEther("100"));
    });

    it("Should allow token approval and transferFrom", async function () {
        await krown.approve(addr1.address, ethers.parseEther("50"));
        expect(await krown.allowance(owner.address, addr1.address)).to.equal(ethers.parseEther("50"));

        await krown.connect(addr1).transferFrom(owner.address, addr2.address, ethers.parseEther("50"));
        expect(await krown.balanceOf(addr2.address)).to.equal(ethers.parseEther("50"));
    });

    it("Should freeze and unfreeze accounts", async function () {
        await krown.freezelvlAccount(addr1.address, true);
        await expect(krown.connect(addr1).transfer(addr2.address, ethers.parseEther("10"))).to.be.reverted;

        await krown.freezelvlAccount(addr1.address, false);
        await krown.transfer(addr1.address, ethers.parseEther("10"));
        expect(await krown.balanceOf(addr1.address)).to.equal(ethers.parseEther("10"));
    });

    it("Should mint new tokens", async function () {
        await krown.mintlvlToken(addr1.address, ethers.parseEther("500"));
        expect(await krown.totalSupply()).to.equal(ethers.parseEther("1500"));
        expect(await krown.balanceOf(addr1.address)).to.equal(ethers.parseEther("500"));
    });

    it("Should burn tokens", async function () {
        await krown.transfer(addr1.address, ethers.parseEther("100"));
        await krown.burnlvlToken(addr1.address, ethers.parseEther("50"));
        expect(await krown.balanceOf(addr1.address)).to.equal(ethers.parseEther("50"));
        expect(await krown.totalSupply()).to.equal(ethers.parseEther("950"));
    });

    it("Should lend tokens", async function () {
        await krown.lend(addr1.address, ethers.parseEther("100"), 30);
        expect(await krown.balanceOf(addr1.address)).to.equal(ethers.parseEther("100"));
    });

    it("Should repay loans", async function () {
        await krown.transfer(addr1.address, ethers.parseEther("100"));
        await krown.connect(addr1).repayLoan(owner.address, ethers.parseEther("50"), "0x" + "0".repeat(64));
        expect(await krown.balanceOf(owner.address)).to.equal(ethers.parseEther("950"));
    });

    it("Should update contract metadata", async function () {
        await krown.setlvlSign("New Sign");
        expect(await krown.sign()).to.equal("New Sign");

        await krown.setlvlNominalValue("New Value");
        expect(await krown.nominalValue()).to.equal("New Value");

        await krown.setlvlWebsite("https://example.com");
        expect(await krown.website()).to.equal("https://example.com");
    });

    it("Should transfer ownership", async function () {
        await krown.transfekbolOwnership(addr1.address);
        expect(await krown.centralAuthority()).to.equal(addr1.address);
    });

    it("Should transfer plutocrat", async function () {
        await krown.transfekbolPlutocrat(addr1.address);
        expect(await krown.plutocrat()).to.equal(addr1.address);
    });

    it("Should set notification fee", async function () {
        await krown.setlvlNfee(ethers.parseEther("1"));
        expect(await krown.notificationFee()).to.equal(ethers.parseEther("1"));
    });

    it("Should revert transfer to 0x0 address", async function () {
        await expect(krown.transfer("0x0000000000000000000000000000000000000000", ethers.parseEther("10"))).to.be.reverted;
    });

    it("Should revert transfer when balance is insufficient", async function () {
        await expect(krown.transfer(owner.address, ethers.parseEther("10000"))).to.be.reverted;
    });

    it("Should revert transferFrom to 0x0 address", async function () {
        await krown.approve(addr1.address, ethers.parseEther("50"));
        await expect(krown.connect(addr1).transferFrom(owner.address, "0x0000000000000000000000000000000000000000", ethers.parseEther("10"))).to.be.reverted;
    });

    it("Should revert transferFrom when balance is insufficient", async function () {
        await krown.approve(addr1.address, ethers.parseEther("50"));
        await expect(krown.connect(addr1).transferFrom(owner.address, addr2.address, ethers.parseEther("10000"))).to.be.reverted;
    });

    it("Should revert transferFrom when allowance is insufficient", async function () {
        await krown.approve(addr1.address, ethers.parseEther("10"));
        await expect(krown.connect(addr1).transferFrom(owner.address, addr2.address, ethers.parseEther("50"))).to.be.reverted;
    });

    it("Should revert lend to 0x0 address", async function () {
        await expect(krown.lend("0x0000000000000000000000000000000000000000", ethers.parseEther("100"), 30)).to.be.reverted;
    });

    it("Should revert lend when balance is insufficient", async function () {
        await expect(krown.lend(addr1.address, ethers.parseEther("10000"), 30)).to.be.reverted;
    });

    it("Should revert lend when duration is too long", async function () {
        await expect(krown.lend(addr1.address, ethers.parseEther("100"), 36136)).to.be.reverted;
    });

    it("Should revert repayLoan to 0x0 address", async function () {
        await krown.transfer(addr1.address, ethers.parseEther("100"));
        await expect(krown.connect(addr1).repayLoan("0x0000000000000000000000000000000000000000", ethers.parseEther("50"), "0x" + "0".repeat(64))).to.be.reverted;
    });

    it("Should revert repayLoan when balance is insufficient", async function () {
        await krown.transfer(addr1.address, ethers.parseEther("100"));
        await expect(krown.connect(addr1).repayLoan(owner.address, ethers.parseEther("1000"), "0x" + "0".repeat(64))).to.be.reverted;
    });

    it("Should revert repayLoan when reference is invalid", async function () {
        await krown.transfer(addr1.address, ethers.parseEther("100"));
        await expect(krown.connect(addr1).repayLoan(owner.address, ethers.parseEther("50"), "0x" + "0".repeat(65))).to.be.reverted;
    });

    it("Should revert settlvlement when _from is plutocrat", async function () {
        await expect(krown.settlvlement(owner.address, ethers.parseEther("50"), addr1.address, "test", "0x" + "0".repeat(64))).to.be.reverted;
    });

    it("Should revert settlvlement to 0x0 address", async function () {
        await expect(krown.settlvlement(addr1.address, ethers.parseEther("50"), "0x0000000000000000000000000000000000000000", "test", "0x" + "0".repeat(64))).to.be.reverted;
    });

    it("Should revert settlvlement when balance is insufficient", async function () {
        await expect(krown.settlvlement(addr1.address, ethers.parseEther("10000"), addr2.address, "test", "0x" + "0".repeat(64))).to.be.reverted;
    });

    it("Should revert settlvlement when reference is invalid", async function () {
        await krown.transfer(addr1.address, ethers.parseEther("100"));
        await expect(krown.settlvlement(addr1.address, ethers.parseEther("50"), addr2.address, "test", "0x" + "0".repeat(65))).to.be.reverted;
    });

    it("Should allow settlvlement", async function () {
        await krown.transfer(addr1.address, ethers.parseEther("100"));
        await krown.settlvlement(addr1.address, ethers.parseEther("50"), addr2.address, "test", "0x" + "0".repeat(64));
        expect(await krown.balanceOf(addr1.address)).to.equal(ethers.parseEther("50"));
        expect(await krown.balanceOf(addr2.address)).to.equal(ethers.parseEther("50"));
    });

    it("Should revert notifyAuthority when balance is insufficient", async function () {
        await krown.setlvlNfee(ethers.parseEther("10000"));
        await expect(krown.notifyAuthority("test", "0x" + "0".repeat(64))).to.be.reverted;
    });

    it("Should revert notifyAuthority when reference is invalid", async function () {
        await krown.setlvlNfee(ethers.parseEther("1"));
        await expect(krown.notifyAuthority("test", "0x" + "0".repeat(65))).to.be.reverted;
    });

    it("Should revert notifyAuthority when notes is invalid", async function () {
        await krown.setlvlNfee(ethers.parseEther("1"));
        await expect(krown.notifyAuthority("01234567890123456789012345678901234567890123456789012345678901234", "0x" + "0".repeat(64))).to.be.reverted;
    });

    it("Should revert notifylvlClients when reference is invalid", async function () {
        await expect(krown.notifylvlClients("test", "0x" + "0".repeat(65))).to.be.reverted;
    });

    it("Should revert notifylvlClients when notes is invalid", async function () {
        await expect(krown.notifylvlClients("01234567890123456789012345678901234567890123456789012345678901234", "0x" + "0".repeat(64))).to.be.reverted;
    });

    it("Should allow notifylvlClients", async function () {
        await krown.notifylvlClients("test", "0x" + "0".repeat(64));
    });

    it("Should allow taxlvlEconomy", async function () {
        await krown.taxlvlEconomy("100", "200", "0.1", "20", "test");
    });

    it("Should allow rebatelvlEconomy", async function () {
        await krown.rebatelvlEconomy("100", "200", "0.1", "20", "test");
    });

    it("Should allow plutocracylvlAchieved", async function () {
        await krown.plutocracylvlAchieved("100", "test");
    });

    it("Should revert burnlvlToken from plutocrat", async function () {
        await expect(krown.burnlvlToken(owner.address, ethers.parseEther("50"))).to.be.reverted;
    });

    it("Should revert burnlvlToken when balance is insufficient", async function () {
        await expect(krown.burnlvlToken(addr1.address, ethers.parseEther("50"))).to.be.reverted;
    });

    it("Should revert freezelvlAccount to plutocrat", async function () {
        await expect(krown.freezelvlAccount(owner.address, true)).to.be.reverted;
    });

    it("Should set and get update", async function () {
        await krown.setlvlUpdate("New Update");
        expect(await krown.update()).to.equal("New Update");
    });

    it("Should initialize with the correct decentralized economy name", async function () {
        expect(await krown.decentralizedEconomy()).to.equal("PLUTOCRACY");
    });

    it("Should initialize with the correct token name", async function () {
        expect(await krown.name()).to.equal("KrownToken");
    });

    it("Should initialize with the correct token symbol", async function () {
        expect(await krown.symbol()).to.equal("KT");
    });

    it("Should initialize with the correct decimals", async function () {
        expect(await krown.decimals()).to.equal(18);
    });

    it("Should allow transfer of ownership by plutocrat", async function () {
        await krown.transfekbolOwnership(addr1.address);
        expect(await krown.centralAuthority()).to.equal(addr1.address);
    });

    it("Should allow transfer of plutocrat by plutocrat", async function () {
        await krown.transfekbolPlutocrat(addr1.address);
        expect(await krown.plutocrat()).to.equal(addr1.address);
    });
});
