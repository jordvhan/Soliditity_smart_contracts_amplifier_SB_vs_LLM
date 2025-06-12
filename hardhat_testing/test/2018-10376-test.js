const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SMT Token", function () {
    let SMT, smt, owner, addr1, addr2, addr3;
    
    beforeEach(async function () {
        SMT = await ethers.getContractFactory("SMT");
        [owner, addr1, addr2, addr3] = await ethers.getSigners();
        smt = await SMT.deploy();
    });

    describe("Deployment", function () {
        it("Should set the right owner", async function () {
            expect(await smt.owner()).to.equal(owner.address);
        });

        it("Should set correct token details", async function () {
            expect(await smt.name()).to.equal("SmartMesh Token");
            expect(await smt.symbol()).to.equal("SMT");
            expect(await smt.decimals()).to.equal(18);
        });
    });

    describe("Token allocation", function () {
        it("Should allocate tokens correctly", async function () {
            const amount = ethers.parseEther("100");
            await smt.allocateTokens([addr1.address], [amount]);
            expect(await smt.balanceOf(addr1.address)).to.equal(amount);
        });

        it("Should fail allocation after end time", async function () {
            await ethers.provider.send('evm_increaseTime', [2 * 24 * 60 * 60]); // 2 days
            await ethers.provider.send('evm_mine');
            
            await expect(
                smt.allocateTokens([addr1.address], [ethers.parseEther("100")])
            ).to.be.reverted;
        });
    });

    describe("Transfer controls", function () {
        it("Should not allow transfers when disabled", async function () {
            const amount = ethers.parseEther("100");
            await smt.allocateTokens([addr1.address], [amount]);
            
            await expect(
                smt.connect(addr1).transfer(addr2.address, amount)
            ).to.be.reverted;
        });

        it("Should allow transfers when enabled", async function () {
            const amount = ethers.parseEther("100");
            await smt.allocateTokens([addr1.address], [amount]);
            await smt.enableTransfer(true);
            
            await smt.connect(addr1).transfer(addr2.address, amount);
            expect(await smt.balanceOf(addr2.address)).to.equal(amount);
        });
    });

    describe("Lock functionality", function () {
        it("Should prevent transfers from locked addresses", async function () {
            const amount = ethers.parseEther("100");
            await smt.allocateTokens([addr1.address], [amount]);
            await smt.enableTransfer(true);
            await smt.addLock(addr1.address);
            
            await expect(
                smt.connect(addr1).transfer(addr2.address, amount)
            ).to.be.reverted;
        });

        it("Should allow transfers after unlock", async function () {
            const amount = ethers.parseEther("100");
            await smt.allocateTokens([addr1.address], [amount]);
            await smt.enableTransfer(true);
            await smt.addLock(addr1.address);
            await smt.removeLock(addr1.address);
            
            await smt.connect(addr1).transfer(addr2.address, amount);
            expect(await smt.balanceOf(addr2.address)).to.equal(amount);
        });
    });

    describe("Approval operations", function () {
        it("Should handle regular approvals", async function () {
            const amount = ethers.parseEther("100");
            await smt.approve(addr1.address, amount);
            expect(await smt.allowance(owner.address, addr1.address)).to.equal(amount);
        });
    });

    describe("Ownership", function () {
        it("Should handle ownership transfer correctly", async function () {
            await smt.changeOwner(addr1.address);
            await smt.connect(addr1).acceptOwnership();
            expect(await smt.owner()).to.equal(addr1.address);
        });

        it("Should prevent non-owners from transferring ownership", async function () {
            await expect(
                smt.connect(addr1).changeOwner(addr2.address)
            ).to.be.reverted;
        });
    });

    describe("Additional Tests", function () {
        it("Should revert if allocateTokens is called with mismatched array lengths", async function () {
            await expect(
                smt.allocateTokens([addr1.address], [ethers.parseEther("100"), ethers.parseEther("200")])
            ).to.be.reverted;
        });

        it("Should revert if allocateTokens is called after allocation end time", async function () {
            await ethers.provider.send('evm_increaseTime', [2 * 24 * 60 * 60]); // 2 days
            await ethers.provider.send('evm_mine');
            
            await expect(
                smt.allocateTokens([addr1.address], [ethers.parseEther("100")])
            ).to.be.reverted;
        });

        it("Should not allow transferProxy with insufficient balance", async function () {
            const amount = ethers.parseEther("100");
            const fee = ethers.parseEther("10");
            const nonce = await smt.getNonce(owner.address);
            const hash = ethers.utils.solidityKeccak256(
                ["address", "address", "uint256", "uint256", "uint256"],
                [owner.address, addr1.address, amount, fee, nonce]
            );
            const signature = await owner.signMessage(ethers.utils.arrayify(hash));
            const { v, r, s } = ethers.utils.splitSignature(signature);

            await expect(
                smt.transferProxy(owner.address, addr1.address, amount, fee, v, r, s)
            ).to.be.reverted;
        });

        it("Should revert transfer if transferEnabled is false", async function () {
            const amount = ethers.parseEther("100");
            await smt.allocateTokens([addr1.address], [amount]);

            await expect(
                smt.connect(addr1).transfer(addr2.address, amount)
            ).to.be.reverted;
        });

        it("Should revert transferFrom if allowance is insufficient", async function () {
            const amount = ethers.parseEther("100");
            await smt.allocateTokens([addr1.address], [amount]);
            await smt.enableTransfer(true);

            await expect(
                smt.connect(addr2).transferFrom(addr1.address, addr3.address, amount)
            ).to.be.reverted;
        });

        it("Should revert if non-owner tries to enable transfer", async function () {
            await expect(
                smt.connect(addr1).enableTransfer(true)
            ).to.be.reverted;
        });

        it("Should revert if non-owner tries to add a lock", async function () {
            await expect(
                smt.connect(addr1).addLock(addr2.address)
            ).to.be.reverted;
        });

        it("Should revert if locked address tries to transfer", async function () {
            const amount = ethers.parseEther("100");
            await smt.allocateTokens([addr1.address], [amount]);
            await smt.enableTransfer(true);
            await smt.addLock(addr1.address);

            await expect(
                smt.connect(addr1).transfer(addr2.address, amount)
            ).to.be.reverted;
        });
    });
});
