---

# Master Thesis on test amplification for Smart Contracts

This guide provides a step-by-step process for testing smart contracts using JavaScript code in the **Hardhat** environment.

---

## Prerequisites

- Ensure you have **Node.js** installed. For Hardhat, Node.js **v18** is recommended. Switch to Node.js v18 using the following command (if you are using `nvm`):

   ```bash
   nvm install 18
   nvm use 18
   ```

   Verify the active Node.js version:
   ```bash
   node -v
   ```
- Put your soldity contracts in hardhat_testing/contracts
- Put your corresponding tests in hardhat_testing/test

---

## Testing Smart Contracts with Hardhat

### 1. Install Hardhat and Required Plugins
Ensure Hardhat and its plugins are installed:
```bash
npm install --save-dev hardhat @nomiclabs/hardhat-truffle5 solidity-coverage
```

---

### 2. Set Up Hardhat
If Hardhat is not initialized, run:
```bash
npx hardhat
```
Choose "Create an empty hardhat.config.js" or customize further as needed.

---

### 3. Configure Hardhat
Update the `hardhat.config.js` file to include the following:
```javascript
require("@nomiclabs/hardhat-truffle5");
require("solidity-coverage");

module.exports = {
  solidity: "0.8.11", // Match your Solidity version
  networks: {
    hardhat: {
      chainId: 1337, // Default Hardhat network
    },
  },
  paths: {
    sources: "./contracts", // Path to contracts
    tests: "./test",        // Path to tests
  },
};
```

---

### 4. Run Tests
Run your tests using Hardhat:
```bash
npx hardhat test
```

---

### 5. Generate Coverage Reports
To generate a coverage report for your tests:
1. Ensure you're using Node.js v18:
   ```bash
   nvm use 18
   ```
2. Run Hardhat coverage:
   ```bash
   npx hardhat coverage
   ```

   This will generate a `coverage/` folder containing detailed test coverage reports.


3. Run Hardhat coverage for a specific file:
   ```bash
   npx hardhat coverage | grep "contractName.sol"
   ```

4. See more detailed report:
   ```bash
   go to hardhat_testing/coverage/lcov-report/index.html
   ```


---

### 6. Install the soldity mutator (mutation testing)

1. Install the mutator
   ```bash
    npm install --save-dev @morenabarboni/sumo
   ```
  
---

### 7. Run the soldity mutator (mutation testing)

1. Run the mutator
   ```bash
    npx sumo pretest       # Check that your original tests pass
    npx sumo disable SCD   # If you get an SCD mutator error
    npx sumo mutate        # Generate .sol mutant files
    npx sumo test          # Run mutation testing

   ```

---

## Summary of Commands

### Hardhat:
- Run tests: `npx hardhat test`
- Generate coverage: `npx hardhat coverage`

---

### Mutation:
- in order 
- `npx sumo pretest`
- `npx sumo disable SCD`
- `npx sumo mutate`
- `npx sumo test`
---

### Contracts that give 0 coverage that normally do not:
- Run: `npx hardhat clean`
- Afterwards recompile/test

---

This guide ensures a smooth workflow for testing smart contracts with Hardhat while maintaining compatibility across tools and environments.
