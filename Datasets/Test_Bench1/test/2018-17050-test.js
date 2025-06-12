const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("PolyAi Contract", function () {
    let owner, addr1, addr2, PolyAi, polyAi;

    beforeEach(async function () {
        [owner, addr1, addr2] = await ethers.getSigners();
        const initialSupply = ethers.parseEther("1000");
        PolyAi = await ethers.getContractFactory("contracts/2018-17050.sol:PolyAi");
        polyAi = await PolyAi.deploy(initialSupply, "PolyAiToken", 18, "PAI");
    });

    it("Should deploy with correct initial supply", async function () {
        const totalSupply = await polyAi.totalSupply();
        expect(totalSupply).to.equal(ethers.parseEther("1000"));
        const ownerBalance = await polyAi.balanceOf(owner.address);
        expect(ownerBalance).to.equal(ethers.parseEther("1000"));
    });

    it("Should transfer tokens between accounts", async function () {
        await polyAi.transfer(addr1.address, ethers.parseEther("100"));
        const addr1Balance = await polyAi.balanceOf(addr1.address);
        expect(addr1Balance).to.equal(ethers.parseEther("100"));
    });

    it("Should fail transfer if sender has insufficient balance", async function () {
        await expect(
            polyAi.connect(addr1).transfer(addr2.address, ethers.parseEther("1"))
        ).to.be.reverted;
    });

    it("Should allow owner to mint tokens", async function () {
        await polyAi.mintToken(addr1.address, ethers.parseEther("500"));
        const addr1Balance = await polyAi.balanceOf(addr1.address);
        expect(addr1Balance).to.equal(ethers.parseEther("500"));
    });

    it("Should freeze and unfreeze accounts", async function () {
        await polyAi.freezeAccount(addr1.address, true);
        await expect(
            polyAi.connect(addr1).transfer(addr2.address, ethers.parseEther("1"))
        ).to.be.reverted;

        await polyAi.freezeAccount(addr1.address, false);
        await polyAi.transfer(addr1.address, ethers.parseEther("100"));
        await polyAi.connect(addr1).transfer(addr2.address, ethers.parseEther("50"));
        const addr2Balance = await polyAi.balanceOf(addr2.address);
        expect(addr2Balance).to.equal(ethers.parseEther("50"));
    });

    it("Should approve and allow transferFrom", async function () {
        await polyAi.approve(addr1.address, ethers.parseEther("200"));
        const allowance = await polyAi.allowance(owner.address, addr1.address);
        expect(allowance).to.equal(ethers.parseEther("200"));

        await polyAi.connect(addr1).transferFrom(
            owner.address,
            addr2.address,
            ethers.parseEther("100")
        );
        const addr2Balance = await polyAi.balanceOf(addr2.address);
        expect(addr2Balance).to.equal(ethers.parseEther("100"));
    });

    it("Should fail transferFrom if allowance is insufficient", async function () {
        await polyAi.approve(addr1.address, ethers.parseEther("50"));
        await expect(
            polyAi.connect(addr1).transferFrom(
                owner.address,
                addr2.address,
                ethers.parseEther("100")
            )
        ).to.be.reverted;
    });
});
