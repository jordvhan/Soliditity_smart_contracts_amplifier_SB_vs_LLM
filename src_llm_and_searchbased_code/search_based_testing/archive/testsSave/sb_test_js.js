const { assert } = require("chai");

describe("Token Contract Amplification", function () {
    let Token;
    let accounts;

    before(async function () {
        accounts = await ethers.getSigners();
        Token = await ethers.getContractFactory("Token");
    });

    it("should amplify tests with random initial supplies", async function () {
        for (let i = 0; i < 100; i++) { // 100 random tests
            const initialSupply = Math.floor(Math.random() * 1e18); // Random supply
            const token = await Token.deploy(initialSupply);
            await token.deployed();

            const balance = await token.balanceOf(accounts[0].address);
            assert.equal(balance.toString(), initialSupply.toString(), `Failed for ${initialSupply}`);
        }
    });
});