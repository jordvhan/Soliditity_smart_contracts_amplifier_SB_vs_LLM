const { assert } = require('chai');
const PublicMath = artifacts ?artifacts.require("PublicMath") : null;

contract('Math (Amplified Tests)', async () => {
	let instance;

	before(async () => {
		instance = await PublicMath.new();
	});

	// -----------------------
	// powerDecimal
	// -----------------------
	it('should correctly calculate edge cases: x^0, x^1', async () => {
		assert.equal(await instance.powDecimal(0, 0), 1, '0^0 should be 1');
		assert.equal(await instance.powDecimal(1, 1), 1, '1^1 should be 1');
		assert.equal(await instance.powDecimal(0, 1), 0, '0^1 should be 0');
		assert.equal(await instance.powDecimal(1, 0), 1, '1^0 should be 1');
	});

	// it('should correctly handle small decimal bases', async () => {
	// 	assert.equal(await instance.powDecimal(0.1, 2), 0.01, '0.1^2 failed');
	// 	assert.equal(await instance.powDecimal(0.01, 2), 0.0001, '0.01^2 failed');
	// 	assert.equal(await instance.powDecimal(0.5, 3), 0.125, '0.5^3 failed');
	// });

	it('should correctly handle large bases with small exponents', async () => {
		assert.equal(
			await instance.powDecimal(1000000000000000, 1),
			1000000000000000,
			'Large base with exponent 1 failed'
		);
		assert.equal(
			await instance.powDecimal(1000000000000000, 2),
			1000000000000000000000000000000,
			'Large base with exponent 2 failed'
		);
	});

	// it('should handle pseudo-randomized decimal inputs', async () => {
	// 	const testCases = [
	// 		{ base: 1.25, exp: 5, result: 3.0528564453125 },
	// 		{ base: 0.9, exp: 3, result: 0.729 },
	// 		{ base: 0.99, exp: 10, result: 0.9043820750088044912 },
	// 	];
	//
	// 	for (const testCase of testCases) {
	// 		assert.equal(
	// 			await instance.powerDecimal(testCase.base, testCase.exp),
	// 			testCase.result,
	// 			'Randomized test case failed'
	// 		);
	// 	}
	// });
});
