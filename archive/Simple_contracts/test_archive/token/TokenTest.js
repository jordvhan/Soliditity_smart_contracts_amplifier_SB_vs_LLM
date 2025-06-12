const { assert } = require("chai"); // Chai is commonly used in Hardhat
const Token = artifacts ? artifacts.require("Token") : null; // Conditional for Hardhat/Truffle compatibility

describe("Token Contract", function () {
    let token;
    const initialSupply = 1000;
    let accounts;

    before(async function () {
        // For Hardhat: Get accounts via ethers
        accounts = accounts || (await web3.eth.getAccounts());
        
        // Deploy the contract
        token = Token ? await Token.new(initialSupply) // Truffle
            : await (await ethers.getContractFactory("Token")).deploy(initialSupply); // Hardhat
    });

    it("should assign the initial supply to the deployer", async function () {
        const balance = await token.balanceOf(accounts[0]);
        assert.equal(
            balance.toString(),
            initialSupply.toString(),
            "Initial supply is incorrect"
        );
    });
    /*
    it("should allow valid transfer", async function () {
        await token.transfer(accounts[1], 100, { from: accounts[0] });
        const balanceSender = await token.balanceOf(accounts[0]);
        const balanceReceiver = await token.balanceOf(accounts[1]);
        assert.equal(
            balanceSender.toString(),
            (initialSupply - 100).toString(),
            "Sender balance incorrect after transfer"
        );
        assert.equal(
            balanceReceiver.toString(),
            "100",
            "Receiver balance incorrect after transfer"
        );
    });

    it("should fail transfer when balance is insufficient", async function () {
        try {
            await token.transfer(accounts[2], 2000, { from: accounts[1] });
            assert(false, "Transfer should have failed due to insufficient balance");
        } catch (error) {
            const isHardhat = typeof error.message === "string" && error.message.includes("revert");
            const isTruffle = typeof error.reason === "string" && error.reason.includes("Insufficient balance");

            assert(
                isHardhat || isTruffle,
                "Error message should indicate insufficient balance"
            );
        }
    });
    

    it("should allow transfer of exact balance", async function () {
        await token.transfer(accounts[0], 100, { from: accounts[1] });
        const balanceReceiver = await token.balanceOf(accounts[0]);
        assert.equal(
            balanceReceiver.toString(),
            initialSupply.toString(),
            "Exact balance transfer failed"
        );
    });
    */
});
