'use strict';

const { artifacts, contract, web3 } = require('hardhat');
const { assert } = require('./common');

const SafeDecimalMath = artifacts.require('SafeDecimalMath');
const PublicMath = artifacts.require('PublicMath');
const { toUnit } = require('../utils')();
const { toBN, BN } = web3.utils;

contract('Math (Test Amplification with Search)', async () => {
    let instance;

    before(async () => {
        PublicMath.link(await SafeDecimalMath.new());
    });

    beforeEach(async () => {
        instance = await PublicMath.new();
    });

    // Fitness function to evaluate the coverage
    function fitness(testCase) {
        // Here, we want to favor edge cases and unusual inputs
        const { base, exponent } = testCase;

        let score = 0;

        // Check for edge cases
        if (base === '0' && exponent === '0') score += 2; // 0^0 is a controversial case
        if (base === '1') score += 1; // 1^n should always return 1
        if (base === '0') score += 1; // 0^n should be 0 for n > 0
        if (exponent === '0') score += 1; // x^0 should always be 1
        if (base === '1000000000000000' && exponent === '100') score += 3; // Big number edge case
        if (base === '1e77' || exponent === '1e77') score += 3; // Overflow risk
        if (base === '0.1') score += 1; // Small decimal base
        if (base === '0.00001') score += 1; // Small decimal base
        if (exponent === '2') score += 1; // x^2 should always be a quadratic result

        return score;
    }

    // Generate random test case (mutation)
    function randomTestCase() {
        const randomBase = Math.random() > 0.5 ? (Math.random() * 1000).toFixed(3) : (Math.random() * 0.1).toFixed(5);
        const randomExponent = Math.floor(Math.random() * 20);
        return { base: randomBase, exponent: randomExponent.toString() };
    }

    // Combine two test cases (crossover)
    function crossover(testCase1, testCase2) {
        const newBase = Math.random() > 0.5 ? testCase1.base : testCase2.base;
        const newExponent = Math.random() > 0.5 ? testCase1.exponent : testCase2.exponent;
        return { base: newBase, exponent: newExponent };
    }

    // Amplify test cases using hill-climbing
    function amplifyTests(initialTestCase, iterations) {
        let bestTestCase = initialTestCase;
        let bestFitness = fitness(bestTestCase);

        for (let i = 0; i < iterations; i++) {
            // Mutation step: generate a new test case by modifying the base or exponent randomly
            const newTestCase = randomTestCase();

            // Evaluate the fitness of the new test case
            const newFitness = fitness(newTestCase);
            if (newFitness > bestFitness) {
                bestTestCase = newTestCase;
                bestFitness = newFitness;
            }

            // Optionally, apply crossover if we want to combine two test cases
            if (Math.random() > 0.5) {
                const anotherTestCase = randomTestCase();
                const crossedOverTestCase = crossover(bestTestCase, anotherTestCase);
                const crossedOverFitness = fitness(crossedOverTestCase);
                if (crossedOverFitness > bestFitness) {
                    bestTestCase = crossedOverTestCase;
                    bestFitness = crossedOverFitness;
                }
            }
        }

        return bestTestCase;
    }

    // -----------------------
    // powerDecimal
    // -----------------------

    it('should correctly calculate x^0 as 1 and amplify edge cases', async () => {
        const initialTestCase = { base: '0', exponent: '0' }; // Controversial case (0^0)
        const amplifiedTestCase = amplifyTests(initialTestCase, 1000); // Perform 1000 iterations of amplification

        const result = await instance.powerDecimal(toUnit(amplifiedTestCase.base), toBN(amplifiedTestCase.exponent));

        console.log('Amplified Test Case: ', amplifiedTestCase);
        console.log('Result: ', result.toString());

        // Example assertion (you can adapt based on your expected results)
        assert.bnEqual(result, toUnit(1), 'The result should be 1 for the amplified test case');
    });
});
