import requests
import json

# # API URL
# url = "https://api.etherscan.io/v2/api"
# params = {
#     "chainid": 1,
#     "module": "contract",
#     "action": "getabi",
#     "address": "0xF4d4eB1E906214e80395dA08256681514EF28C0f",
#     "apikey": "95C8DR9KHD1EEV4BSB5358MR8HK6CZJSTI"
# }
contract_address = "0x7A885F074643642Cf402318e6488410Ff7b7a458"
api_key = "95C8DR9KHD1EEV4BSB5358MR8HK6CZJSTI"
url = f"https://api.etherscan.io/api?module=contract&action=getsourcecode&address={contract_address}&apikey={api_key}"

# Make the API request
response = requests.get(url)

# Save the response JSON to a file
if response.status_code == 200:
    with open("responses/response.json", "w") as file:
        json.dump(response.json(), file, indent=4)
    # print("Response saved to response.json")
    # data = response.json()  # Convert to a dictionary
    # print(data.get('result', 'No result field found'))  # Safely access 'result'
    json_data = response.json()
    source_code = json_data['result'][0]['SourceCode']

    # Save to a file
    with open('../search_based_testing/constracts/test_contract.sol', 'w') as solidity_file:
        solidity_file.write(source_code)
else:
    print(f"Failed to fetch data: {response.status_code}")
