import random
from web3 import Web3
from eth_tester import EthereumTester
from solcx import compile_source

# Compile the Token Contract
with open("Token.sol", "r") as file:
    contract_source = file.read()

compiled_sol = compile_source(contract_source)
contract_interface = compiled_sol['<stdin>:Token']

# Set up a local blockchain (e.g., Ganache)
w3 = Web3(EthereumTester())


# Deploy the contract with a random initial supply
def deploy_contract(initial_supply):
    Token = w3.eth.contract(
        abi=contract_interface['abi'],
        bytecode=contract_interface['bin']
    )
    tx_hash = Token.constructor(initial_supply).transact()
    tx_receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
    return w3.eth.contract(
        address=tx_receipt.contractAddress,
        abi=contract_interface['abi']
    )


# Random Test Amplification
def amplify_tests():
    for _ in range(100):  # Generate 100 test cases
        initial_supply = random.randint(0, 10 ** 18)  # Random supply
        token = deploy_contract(initial_supply)

        # Verify the deployer's balance
        balance = token.functions.balanceOf(w3.eth.accounts[0]).call()
        assert balance == initial_supply, f"Test failed for supply {initial_supply}"
        print(f"Test passed for supply: {initial_supply}")


amplify_tests()
