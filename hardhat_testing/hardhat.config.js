/** @type import('hardhat/config').HardhatUserConfig */
require("@nomiclabs/hardhat-truffle5");
require("solidity-coverage");
require("@nomicfoundation/hardhat-ethers"); // Added ethers plugin
require("@nomicfoundation/hardhat-chai-matchers");

module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.8.24",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200, // You can adjust this (e.g., 50 for smaller contracts)
          },
        },
      },
      // { version: "0.8.20" }, // Second compiler version (commented out)
      {
        version: "0.5.3", // Added version for ^0.5.3
      },
      {
        version: "0.4.24", // Added version for ^0.4.24
      },
      {
        version: "0.4.11", // Added version for ^0.4.11
      },
      {
        version: "0.4.2", // Added version for ^0.4.2
      },
      {
        version: "0.4.4", // Added version for ^0.4.4
      },
      {
        version: "0.4.19", // Added version for ^0.4.19
      },
    ],
  },
  networks: {
    hardhat: {
      chainId: 1337, // Hardhat's default in-memory chain
    },
  },
  paths: {
    sources: "./contracts", // Path to contracts
    tests: "./test",        // Path to test files
    cache: "./cache",       // Path to cache
    artifacts: "./artifacts", // Path to artifacts
  },
};