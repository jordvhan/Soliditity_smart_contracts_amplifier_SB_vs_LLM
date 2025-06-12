import os
import requests
import json

# Set your Hugging Face API key
HUGGINGFACE_API_KEY = ""

# Hugging Face model endpoint for Llama-3.3-70B-Instruct
MODEL_ENDPOINT = "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct"

# Function to Generate Solidity Test Cases
def generate_code(contract_code, test_code):
    prompt = f"""
        Here is a Solidity smart contract:
        {contract_code}

        Here is the existing JavaScript test file:
        {test_code}

        Generate additional JavaScript unit tests to improve the coverage of the Solidity contract.
        Ensure the tests handle edge cases, reentrancy attacks, and common Solidity vulnerabilities.
        """

    headers = {
        "Authorization": f"Bearer {HUGGINGFACE_API_KEY}",
        "Content-Type": "application/json"
    }

    payload = {
        "inputs": prompt,
        "parameters": {"max_new_tokens": 512, "temperature": 0.7, "top_p": 0.9}
    }

    # Send request to Hugging Face API
    response = requests.post(MODEL_ENDPOINT, headers=headers, json=payload)

    if response.status_code == 200:
        result = response.json()
        generated_text = result[0]["generated_text"]

        print("\nGenerated Test Cases:\n")
        print(generated_text)
    else:
        print("Error:", response.status_code, response.text)

# Example usage
contract_code = open("../../hardhat_testing/contracts/token.sol", "r").read()
test_code = open("../../hardhat_testing/test/TokenTest.js", "r").read()

generate_code(contract_code, test_code)
