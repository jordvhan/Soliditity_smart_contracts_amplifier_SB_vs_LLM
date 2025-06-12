// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract PublicMath {
    uint public constant UNIT = 10**18;  // 18 decimals of precision for simplicity

    // Power function for fixed-point numbers (18 decimals of precision)
    function powDecimal(uint x, uint n) public pure returns (uint) {
        uint result = UNIT;  // Start with 1 (UNIT is 10**18)
        while (n > 0) {
            if (n % 2 != 0) {
                result = result * x / UNIT;  // Multiply and divide to simulate fixed-point math
            }
            x = x * x / UNIT;  // Square the base (x) in each iteration
            n /= 2;
        }
        return result;
    }
}
