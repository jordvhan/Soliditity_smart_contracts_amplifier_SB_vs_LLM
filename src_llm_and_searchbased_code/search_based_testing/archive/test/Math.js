//'use strict';

//const { artifacts, contract, web3 } = require('hardhat');
const { assert } = require('chai');

const PublicMath = artifacts ?artifacts.require("PublicMath") : null;


contract('Math', async () => {
	let instance;

	before(async () => {
		instance = await PublicMath.new();
	});

	// -----------------------
	// powerDecimal
	// -----------------------
	it('should correctly calculate x^0 as 1', async () => {
		assert.equal(await instance.powDecimal(46, 0), 1);
		assert.equal(await instance.powDecimal(1000000000, 0), 1);
		assert.equal(await instance.powDecimal(1, 0), 1);
	});

	it('should return correct results for expected power for x^1 as x', async () => {
		assert.equal(await instance.powDecimal(10, 1), 10);
		assert.equal(await instance.powDecimal(46, 1), 46);
	});

	it('should return correct results for expected power for x^2', async () => {
		assert.equal(await instance.powDecimal(10, 2), 100);
		assert.equal(await instance.powDecimal(5, 2), 25);
		assert.equal(await instance.powDecimal(2, 2), 4);
	});

	it('should return correct results for expected power for x^n', async () => {
		assert.equal(await instance.powDecimal(10, 1), 10);
		assert.equal(await instance.powDecimal(10, 2), 100);
		assert.equal(await instance.powDecimal(10, 3), 1000);
		assert.equal(await instance.powDecimal(10, 4), 10000);
		assert.equal(await instance.powDecimal(10, 5), 100000);
	});

	// it('should return correct results for expected power of decimals x^n', async () => {
	// 	assert.equal(await instance.powDecimal(1.25, 1), 1.25);
	// 	assert.equal(await instance.powDecimal(1.25, 2), 1.5625);
	// 	assert.equal(await instance.powDecimal(1.25, 3), 1.953125);
	// 	assert.equal(await instance.powDecimal(1.25, 4), 2.44140625);
	// });

	// it('should revert overflow uint when base number power to x^n is too large', async () => {
	// 	await assert.revert(
	// 		instance.powDecimal(10000000000000000000000000000, 100)
	// 	);
	// });
});
