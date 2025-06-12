//'use strict';

//const { artifacts, contract, web3 } = require('hardhat');

const { assert } = require('chai');
const PublicMath = artifacts ?artifacts.require("PublicMath") : null;

//const PublicMath = artifacts.require('PublicMath');

// const { toUnit } = require('../utils')();
//
// const { toBN } = web3.utils;

describe('Math Contract', function () {
	let instance;

	before(async function () {
		// Save ourselves from having to await deploye
		instance = await PublicMath.new();
	});

	// TESTS
	it('should correctly return the power for a positive and negative number 1', async () => {
		let result = await instance.powDecimal(2, 3);
		assert.equal(result, 8.0);
	});

	// it('should correctly return the power for a positive and negative number 2', async () => {
	// 	let result = await instance.powDecimal(2, 4);
	// 	assert.equal(result, 16.0);
	// });
	//
	// it('should correctly return the power for a positive and negative number 3', async () => {
	// 	let result = await instance.powDecimal(1, 5);
	// 	assert.equal(result, 1);
	// });
	//
	// it('should correctly return the power for a positive and negative number 4', async () => {
	// 	let result = await instance.powDecimal(1, 0);
	// 	assert.equal(result, 1);
	// });
});
