import os
import json
import subprocess

CONTRACTS_DIR = "contracts"
TESTS_DIR = "generated_tests"

TEST_TEMPLATE = """const {{ expect }} = require("chai");

describe("{contract_name}", function () {{
    let contract;
    let owner, addr1;

    before(async function () {{
        [owner, addr1] = await ethers.getSigners();
        const Contract = await ethers.getContractFactory("{contract_name}");
        contract = await Contract.deploy();
        await contract.deployed();
    }});

    it("Should deploy the contract", async function () {{
        expect(contract.address).to.properAddress;
    }});

{test_functions}
}});
"""

FUNCTION_TEMPLATE = """    it("Should {test_action} `{function_name}`", async function () {{
        {setup_code}
        {call_code}
        {assert_code}
    }});\n"""


def get_contract_analysis(contract_path):
    """Uses Slither to analyze the Solidity contract and extract function details."""
    try:
        result = subprocess.run(
            ["slither", contract_path, "--json", "-"],
            capture_output=True,
            text=True,
            check=True
        )
        return json.loads(result.stdout)
    except Exception as e:
        print(f"Error analyzing {contract_path}: {e}")
        return {}


def generate_test_function(function):
    """Generates a meaningful test case for a given Solidity function."""
    name = function["name"]
    visibility = function["visibility"]
    state = function["stateMutability"]
    inputs = function["parameters"]
    outputs = function["returns"]

    is_view = state in ["view", "pure"]
    is_payable = state == "payable"

    # Generate input values
    args = []
    setup_code = ""
    for i, param in enumerate(inputs):
        param_name = param.get("name", f"arg{i}")
        param_type = param["type"]

        # Generate dummy values for common Solidity types
        if "uint" in param_type:
            value = "100"
        elif "int" in param_type:
            value = "-10"
        elif "bool" in param_type:
            value = "true"
        elif "address" in param_type:
            value = "addr1.address"
        elif "string" in param_type:
            value = '"test_string"'
        else:
            value = "0"

        args.append(value)

    args_str = ", ".join(args)

    # Generate function call
    if is_view:
        call_code = f"const result = await contract.callStatic.{name}({args_str});"
    else:
        call_code = f"await contract.{name}({args_str});"

    # Handle payable functions
    if is_payable:
        setup_code = 'const tx = { value: ethers.utils.parseEther("1") };'
        call_code = f"await contract.{name}({args_str}, tx);"

    # Generate assertions
    if outputs:
        return_type = outputs[0]["type"]
        if "uint" in return_type or "int" in return_type:
            assert_code = 'expect(result).to.be.a("number");'
        elif "bool" in return_type:
            assert_code = 'expect(result).to.be.a("boolean");'
        elif "address" in return_type:
            assert_code = 'expect(result).to.be.properAddress;'
        else:
            assert_code = 'expect(result).to.exist;'
    else:
        assert_code = ""

    test_action = "execute" if not is_view else "retrieve value from"
    return FUNCTION_TEMPLATE.format(
        function_name=name,
        test_action=test_action,
        setup_code=setup_code,
        call_code=call_code,
        assert_code=assert_code
    )


def generate_tests():
    """Generates JavaScript test files with refined test cases based on Solidity contracts."""
    if not os.path.exists(TESTS_DIR):
        os.makedirs(TESTS_DIR)

    for filename in os.listdir(CONTRACTS_DIR):
        if filename.endswith(".sol"):
            contract_name = filename.replace(".sol", "")
            contract_path = os.path.join(CONTRACTS_DIR, filename)
            contract_data = get_contract_analysis(contract_path)

            test_functions = ""
            for contract in contract_data.get("contracts", []):
                for function in contract.get("functions", []):
                    if function["visibility"] in ["public", "external"]:
                        test_functions += generate_test_function(function)

            test_content = TEST_TEMPLATE.format(
                contract_name=contract_name, test_functions=test_functions
            )

            test_file_path = os.path.join(TESTS_DIR, f"{contract_name}_test.js")
            with open(test_file_path, "w") as test_file:
                test_file.write(test_content)

            print(f"Generated {test_file_path}")


if __name__ == "__main__":
    generate_tests()
