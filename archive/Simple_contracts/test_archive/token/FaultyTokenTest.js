// FaultyTokenTest.js
const { assert } = require("chai"); // Chai is commonly used in Hardhat
const Token = artifacts ? artifacts.require("Token") : null; // Conditional for Hardhat/Truffle compatibility

contract("Token", (accounts) => {
    let token;
    const initialSupply = 1000;

    before(async () => {
        token = await Token.new(initialSupply);
    });

    it("should assign the total supply to the wrong account", async () => {
        // Intentional error: expecting total supply in an incorrect account
        const balance = await token.balanceOf(accounts[1]);
        assert.equal(balance.toNumber(), initialSupply, "Initial supply incorrectly assigned");
    });

    it("should fail on valid transfer check", async () => {
        // Intentional error: attempting to transfer more than balance
        await token.transfer(accounts[2], 2000, { from: accounts[0] });
        const balanceReceiver = await token.balanceOf(accounts[2]);
        assert.equal(balanceReceiver.toNumber(), 2000, "Receiver balance should be 2000 after transfer");
    });

    it("should fail on exact balance transfer", async () => {
        // Intentional error: asserting wrong balance after a transfer
        await token.transfer(accounts[1], 100, { from: accounts[0] });
        const balanceSender = await token.balanceOf(accounts[0]);
        assert.equal(balanceSender.toNumber(), initialSupply, "Sender's balance should still be initial supply");
    });
});
