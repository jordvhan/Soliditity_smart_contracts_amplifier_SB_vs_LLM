import subprocess
import random
import re
import time
import os
from pprint import pprint


def run_hardhat_test():
    """Run Hardhat tests and return the coverage report."""
    result = subprocess.run(
        ["wsl", "npx", "hardhat", "coverage"],
        capture_output=True, text=True, encoding='utf-8'
    )
    return result.stdout


def get_coverages(output, filenames: list) -> dict:
    """Extract and return coverage details from Hardhat test output."""
    # You'll need to parse the coverage report from the Hardhat output
    # For example, extract coverage percentage or detailed stats
    ret_dict: dict = dict()

    # 2018-11429.sol   |    65.71 |    35.71 |    66.67 |    70.83 |... 1,46,75,114 |
    output_list = output.split('\n')
    for l in output_list:
        line = l.replace(" ", "")
        out = line.split("|")
        if out[0] in filenames:
            ret_dict[out[0]] = {"% Stmts": out[1], "% Branch": out[2], "% Funcs": out[3], "% Lines": out[4]}

    return ret_dict


def make_smart_mutation(test_case):
    """Introduce smart mutations: edge cases, invalid inputs, boundary values."""

    def replace_with_smart_value(match):
        num_type = random.choice(["int", "int"])  # Randomly decide between int and float

        if num_type == "int":
            # Smart mutations for integers
            # mutation_type = random.choice(["valid", "zero", "large", "boundary"])
            # mutation_type = random.choice(["valid", "negative", "zero", "large", "boundary"])
            mutation_type = random.choices(
                ["valid", "negative", "zero", "large", "boundary"],
                weights=[22, 12, 22, 22, 22],
                k=1
            )[0]

            if mutation_type == "valid":
                return str(random.randint(1, 1000))  # Random integer between 1 and 1000
            elif mutation_type == "negative":
                return str(random.randint(-1000, -1))  # Negative integer
            elif mutation_type == "zero":
                return "0"  # Test edge case with zero
            elif mutation_type == "large":
                return str(random.randint(1000000, 1000000000))  # Large number
            elif mutation_type == "boundary":
                return str(random.choice([2 ** 31 - 1, 2 ** 31 - 1]))
                # return str(random.choice([2 ** 31 - 1, -2 ** 31]))  # Edge case for boundary of int32
        else:
            # Smart mutations for floats
            mutation_type = random.choice(["valid", "negative", "zero", "large", "boundary"])

            if mutation_type == "valid":
                return str(round(random.uniform(1.0, 1000.0), 2))  # Valid float between 1.0 and 1000.0
            elif mutation_type == "negative":
                return str(round(random.uniform(-1000.0, -1.0), 2))  # Negative float
            elif mutation_type == "zero":
                return "0.0"  # Zero float
            elif mutation_type == "large":
                return str(round(random.uniform(1000000.0, 1000000000.0), 2))  # Large float
            elif mutation_type == "boundary":
                return str(
                    random.choice([float('-inf'), float('inf'), float('nan')]))  # Boundary float values (NaN, Inf)

    mutated_test = re.sub(r'\b\d+\.\d+\b|\b\d+\b', replace_with_smart_value, test_case)  # Match integers and floats
    return mutated_test

"""
  it("should mint tokens", async function () {
    // Use ethers.utils.parseEther correctly here
    await atl.connect(ico).mint(addr1.address, ethers.utils.parseEther("100"));
    expect(await atl.balanceOf(addr1.address)).to.equal(ethers.utils.parseEther("100"));
  });
"""
def generate_test_signature(test_case: list, test_name: str):
    test_signature = f'  it("{test_name}' + r'", async function () {' + '\n'
    for line in test_case:
        if line is not None:
            test_signature += "    " + line + '\n'
    test_signature += r'  });'
    return test_signature

counter = 0
def assemble_test_cases(all_tests: list):
    full_test_file = ""
    global counter
    for test in all_tests:
        counter += 1
        test_name = f"test {counter}"
        full_test_file += generate_test_signature(test_case=test, test_name=test_name)
        full_test_file += '\n\n'
    return full_test_file

def remove_unnecessary_describe_sections(full_test: str) -> str:
    """
    some tests have multiple describes to show different sections. Amplification doesn't have sections so when
    rebuilding, all subsections must be removed. The parser doesn't parse them so only the first subsection needs
    to be removed since the rest won't be present at all. So keep the first section 'ctr=0' and ignore all sections
    after that 'ctr=1'
    :param full_test: full test file with at least 1 section and 0 or more subsections
    :return: full test with only the main section
    """
    sections = full_test.split('\n')
    processed_full_test = ""
    ctr = 0
    for section in sections:
        if 'describe("' in section:
            if ctr == 1:
                continue
            else:
                ctr = 1
        processed_full_test += section + '\n'

    return processed_full_test

def assemble_full_test_file(all_test_cases: str, original_test: str):
    full_test = ""
    if 'it("' in original_test:
        full_test += original_test.split('it("')[0]
        full_test += "\n"
        full_test += all_test_cases
        full_test += '});'
        full_test = remove_unnecessary_describe_sections(full_test=full_test)
        return full_test
    else:
        return original_test

def update_test_case_expectancy(test_case: str):
    if 'expect' in test_case:
        if '.to.' in test_case:
            if test_case[-1] == ';':
                test_case = test_case[:-1]
            if '.to.be.revert' in test_case:
                return test_case.split(").to.")[0] + ').to.be.reverted;'
            elif '.to.equal' in test_case:
                return test_case.split(").to.")[0] + ').to.be.ok;'
            else:
                return test_case.split(").to.")[0] + ').to.be.reverted;'
    else:
        if test_case.startswith(('if', 'else', 'try', 'catch')):
            return test_case
        if test_case[-1] == ';':
            test_case = test_case[:-1]
        if '=' in test_case:
            if 'ethers.parseEther' in test_case:
                return test_case + ";"
            else:  # is this an edge case?
                return test_case.split("=")[0] + '= expect(' + test_case.split("=")[1] + ').to.be.ok;'
        else:
            return 'expect(' + test_case + ').to.be.ok;'

def random_search_amplification(original_test_cases: list, test_name, iterations=10):
    """Perform random search to amplify the test case."""

    # Delete existing files before starting the mutation process
    for it in range(iterations):
        filename = f"test_file{it}.js"
        file_path = f"test/random_search/{filename}"

        # Check if the file exists and remove it
        if os.path.exists(file_path):
            os.remove(file_path)

    # Run the tests with Hardhat
    # base_output = run_hardhat_test()
    all_tests = []
    for it in range(iterations):
        for test_case in original_test_cases:
            new_test_cases = []

            mutation_ctr = 0
            for test_case_line in test_case:

                mutated_line = make_smart_mutation(test_case_line)
                new_test_cases.append(mutated_line)
                if mutated_line != test_case_line:
                    mutation_ctr += 1

            new_test_cases_expanded = [[] for _ in range(2**mutation_ctr)]
            n = len(new_test_cases_expanded)
            alternation = 1
            alternation_ctr = 0
            mode = True
            for i in range(len(test_case)):
                if test_case[i] == new_test_cases[i]:
                    for j in range(n):
                        new_test_cases_expanded[j].append(test_case[i])
                else:
                    for j in range(n):
                        if alternation == alternation_ctr:
                            alternation_ctr = 0
                            mode = not mode  # true to false or vice versa
                        else:
                            alternation_ctr += 1

                        if mode:
                            new_test_cases_expanded[j].append(new_test_cases[i])
                        else:
                            new_test_cases_expanded[j].append(update_test_case_expectancy(new_test_cases[i]))

                    alternation *= 2
                    alternation_ctr = 0

            all_tests.extend(new_test_cases_expanded)

    filename = f"test_file_{test_name}.js"
    # filenames.append(filename)

    # Write the mutated test to a temporary file
    # with open("test/random_search/" + filename, "w") as f:
    #     f.write(mutated_test)

    # Run the tests with Hardhat
    # output = run_hardhat_test()

    # Get the coverage report
    # original_coverage = get_coverages(base_output, filenames)
    # coverages = get_coverages(output, filenames)

    # pprint(original_coverage)
    # pprint(coverages)

    full_test = assemble_test_cases(all_tests)

    return full_test

def extract_test_cases(test_code):
    pattern = r'it\((?:.|\n)*?\{((?:.|\n)*?)^\s*\}\);'
    matches = re.finditer(pattern, test_code, re.MULTILINE)

    test_cases = []
    for match in matches:
        test_body = match.group(1).strip()
        lines = [line.strip() for line in test_body.split('\n') if line.strip()]
        test_cases.append(lines)

    return test_cases

def post_process_test_cases(test_cases):
    processed = []

    for test_case in test_cases:
        merged_lines = []
        buffer = ""

        # def strip_comment_and_whitespace(line):
        #     return line.split("//")[0].rstrip()

        def strip_comment_and_whitespace(line):
            # Match '//' that is NOT preceded by ':' (to avoid 'http://', etc.)
            comment_match = re.search(r'(?<!:)//', line)
            if comment_match:
                line = line[:comment_match.start()]
            return line.rstrip()

        def brackets_balanced(s):
            stack = []
            pairs = {')': '(', ']': '[', '}': '{'}
            for c in s:
                if c in "([{":
                    stack.append(c)
                elif c in ")]}":
                    if not stack or stack[-1] != pairs[c]:
                        return False
                    stack.pop()
            return len(stack) == 0

        for line in test_case:
            clean_line = strip_comment_and_whitespace(line)

            # if clean_line.startswith('expect(await contract.name()).to.equal("NewIntelTechMedia");'):
            #     a = 2

            if not clean_line:
                continue  # Skip empty/comment-only lines

            # if a previous line ended in brackets and current line starts in dot, it means that this part
            # belongs to the previous line but has a function chained on it
            if clean_line.startswith('.'):
                # it belongs to the previous line, which is no longer in buffer
                if not buffer:
                    merged_lines[-1] = merged_lines[-1] + clean_line
                # it belongs to the previous line, which is in the buffer
                else:
                    buffer += clean_line
                continue

            if buffer:
                buffer += " " + clean_line
            else:
                buffer = clean_line

            if brackets_balanced(buffer):
                merged_lines.append(buffer.strip())
                buffer = ""

        if buffer:  # Add any remaining content
            merged_lines.append(buffer.strip())

        processed.append(merged_lines)

    return processed


# Original test string (simplified for illustration)
# 2018-11429.sol   |    65.71 |    35.71 |    66.67 |    70.83 |... 1,46,75,114 |
#  2018-11429.sol   |    65.71 |    39.29 |    66.67 |    72.92 |... 7,41,75,114 |
original_test_name = '2018-11429.sol'
original_test = """
const { expect } = require("chai");

// Import Hardhat's test utilities
const { ethers } = require("hardhat");

describe("ATL Token", function () {
  let ATL, atl, owner, addr1, addr2, ico;

  beforeEach(async function () {
    [owner, addr1, addr2, ico] = await ethers.getSigners();

    // Deploy ATL contract
    const ATLFactory = await ethers.getContractFactory("ATL");
    atl = await ATLFactory.deploy(ico.address);
  });

  it("should mint tokens", async function () {
    // Use ethers.utils.parseEther correctly here
    await atl.connect(ico).mint(addr1.address, ethers.utils.parseEther("100"));
    expect(await atl.balanceOf(addr1.address)).to.equal(ethers.utils.parseEther("100"));
  });

  it("should unfreeze tokens", async function () {
    await atl.connect(ico).unfreeze();
    expect(await atl.tokensAreFrozen()).to.equal(false);
  });

  it("should allow transfers after unfreezing", async function () {
    await atl.connect(ico).mint(owner.address, ethers.utils.parseEther("100"));
    await atl.connect(ico).unfreeze();
    await atl.transfer(addr1.address, ethers.utils.parseEther("50"));
    expect(await atl.balanceOf(addr1.address)).to.equal(ethers.utils.parseEther("50"));
  });

  it("should approve and allow transferFrom", async function () {
    await atl.connect(ico).mint(owner.address, ethers.utils.parseEther("100"));
    await atl.connect(ico).unfreeze();
    await atl.approve(addr1.address, ethers.utils.parseEther("50"));
    await atl.connect(addr1).transferFrom(owner.address, addr2.address, ethers.utils.parseEther("50"));
    expect(await atl.balanceOf(addr2.address)).to.equal(ethers.utils.parseEther("50"));
  });
});
"""

original_test_small = """
const { expect } = require("chai");

// Import Hardhat's test utilities
const { ethers } = require("hardhat");

describe("ATL Token", function () {
  let ATL, atl, owner, addr1, addr2, ico;

  beforeEach(async function () {
    [owner, addr1, addr2, ico] = await ethers.getSigners();

    // Deploy ATL contract
    const ATLFactory = await ethers.getContractFactory("ATL");
    atl = await ATLFactory.deploy(ico.address);
  });

  it("should mint tokens", async function () {
    // Use ethers.utils.parseEther correctly here
    await atl.connect(ico).mint(addr1.address, ethers.utils.parseEther("100"));
    expect(await atl.balanceOf(addr1.address)).to.equal(ethers.utils.parseEther("100"));
  });

  it("should allow transfers after unfreezing", async function () {
    await atl.connect(ico).mint(owner.address, ethers.utils.parseEther("100"));
    await atl.connect(ico).unfreeze();
    await atl.transfer(addr1.address, ethers.utils.parseEther("50"));
    expect(await atl.balanceOf(addr1.address)).to.equal(ethers.utils.parseEther("50"));
  });
});
"""

original_test_big = """
const { expect } = require("chai");
const { ethers } = require("hardhat");
const {defaultAbiCoder} = require("@ethersproject/abi");
const {splitSignature} = require("@ethersproject/bytes");
const { keccak256 } = require("ethers");


describe("SMT Contract", function () {
  let SMT, smt, owner, addr1, addr2, addr3;

  beforeEach(async function () {
    [owner, addr1, addr2, addr3] = await ethers.getSigners();
    const SMTFactory = await ethers.getContractFactory("SMT");
    smt = await SMTFactory.deploy();
  });

  it("Should deploy with correct initial values", async function () {
    expect(await smt.name()).to.equal("SmartMesh Token");
    expect(await smt.symbol()).to.equal("SMT");
    expect(await smt.decimals()).to.equal(18);
  });

  it("Should allow the owner to allocate tokens", async function () {
    const owners = [addr1.address, addr2.address];
    const values = [ethers.parseEther("100"), ethers.parseEther("200")];

    await smt.allocateTokens(owners, values);

    expect(await smt.balanceOf(addr1.address)).to.equal(ethers.parseEther("100"));
    expect(await smt.balanceOf(addr2.address)).to.equal(ethers.parseEther("200"));
  });

  it("Should revert allocation after the allocation period ends", async function () {
    await ethers.provider.send("evm_increaseTime", [24 * 60 * 60]); // Increase time by 1 day
    await ethers.provider.send("evm_mine");

    const owners = [addr1.address];
    const values = [ethers.parseEther("100")];

    await expect(smt.allocateTokens(owners, values)).to.be.reverted;
  });

  it("Should allow token transfers when enabled", async function () {
    await smt.allocateTokens([addr1.address], [ethers.parseEther("100")]);
    await smt.enableTransfer(true);

    await smt.connect(addr1).transfer(addr2.address, ethers.parseEther("50"));

    expect(await smt.balanceOf(addr1.address)).to.equal(ethers.parseEther("50"));
    expect(await smt.balanceOf(addr2.address)).to.equal(ethers.parseEther("50"));
  });

  it("Should not allow token transfers when disabled", async function () {
    await smt.allocateTokens([addr1.address], [ethers.parseEther("100")]);

    await expect(
      smt.connect(addr1).transfer(addr2.address, ethers.parseEther("50"))
    ).to.be.reverted;
  });

  it("Should revert approveProxy if signature is invalid", async function () {
    const feeSmt = 5;
    const nonce = await smt.getNonce(owner.address);

    // Use ethers.utils.defaultAbiCoder to encode the parameters into the correct format
    const encodedData = defaultAbiCoder.encode(
      ["address", "address", "uint256", "uint256", "uint256"],
      [owner.address, addr1.address, 100, nonce, feeSmt]
    );

    // Create the message hash (keccak256 of the encoded data)
    const msgHash = keccak256(encodedData);

    // Sign the message with an incorrect signer (addr1 instead of owner)
    const sign = await addr1.signMessage(ethers.hexlify(ethers.toUtf8Bytes(msgHash))); // Use hexlify and toUtf8Bytes
    const { r, s, v } = splitSignature(sign);

    // Expect the transaction to revert with the invalid signature
    await expect(smt.approveProxy(owner.address, addr1.address, 100, v, r, s)).to.be.reverted;
  });

  it("Should allow the owner to change ownership", async function () {
    await smt.changeOwner(addr1.address);
    await smt.connect(addr1).acceptOwnership();

    expect(await smt.owner()).to.equal(addr1.address);
  });

  it("Should allow approvals and allowance checks", async function () {
    await smt.allocateTokens([addr1.address], [ethers.parseEther("100")]);

    await smt.connect(addr1).approve(addr2.address, ethers.parseEther("50"));

    expect(await smt.allowance(addr1.address, addr2.address)).to.equal(ethers.parseEther("50"));
  });

  it("Should allow transfers via transferFrom", async function () {
    await smt.allocateTokens([addr1.address], [ethers.parseEther("100")]);
    await smt.enableTransfer(true);

    await smt.connect(addr1).approve(addr2.address, ethers.parseEther("50"));
    await smt.connect(addr2).transferFrom(addr1.address, addr3.address, ethers.parseEther("50"));

    expect(await smt.balanceOf(addr1.address)).to.equal(ethers.parseEther("50"));
    expect(await smt.balanceOf(addr3.address)).to.equal(ethers.parseEther("50"));
  });

it("Should not allow transferFrom if allowance is insufficient", async function () {
    // Allocate tokens to addr1
    await smt.allocateTokens([addr1.address], [ethers.parseEther("100")]);

    // Enable transfers
    await smt.enableTransfer(true);

    // Addr1 approves addr2 to transfer 30 tokens on its behalf
    await smt.connect(addr1).approve(addr2.address, ethers.parseEther("30"));

    // Check balances before transfer
    const addr1BalanceBefore = await smt.balanceOf(addr1.address);
    const addr2BalanceBefore = await smt.balanceOf(addr2.address);
    const addr3BalanceBefore = await smt.balanceOf(addr3.address);

    // Try to transfer more than the approved allowance (50 tokens) from addr1 to addr3 by addr2
    await smt.connect(addr2).transferFrom(addr1.address, addr3.address, ethers.parseEther("50"));

    // Check balances after the attempted transfer
    const addr1BalanceAfter = await smt.balanceOf(addr1.address);
    const addr2BalanceAfter = await smt.balanceOf(addr2.address);
    const addr3BalanceAfter = await smt.balanceOf(addr3.address);

    // Assert that balances have not changed if the transfer should not occur
    expect(addr1BalanceBefore).to.equal(addr1BalanceAfter);
    expect(addr2BalanceBefore).to.equal(addr2BalanceAfter);
    expect(addr3BalanceBefore).to.equal(addr3BalanceAfter);
});

});


"""


# Run random search to amplify the test
# amplified_test = random_search_amplification(post_process_test_cases(extract_test_cases(test_code=original_test_big)), original_test_name, iterations=1)

# print(assemble_full_test_file(all_test_cases=amplified_test, original_test=original_test_big))

"""
[['await atl.connect(ico).mint(addr1.address, ethers.utils.parseEther("100"));',
  'expect(await '
  'atl.balanceOf(addr1.address)).to.equal(ethers.utils.parseEther("100"));'],
 ['await atl.connect(ico).unfreeze();',
  'expect(await atl.tokensAreFrozen()).to.equal(false);'],
 ['await atl.connect(ico).mint(owner.address, ethers.utils.parseEther("100"));',
  'await atl.connect(ico).unfreeze();',
  'await atl.transfer(addr1.address, ethers.utils.parseEther("50"));',
  'expect(await '
  'atl.balanceOf(addr1.address)).to.equal(ethers.utils.parseEther("50"));'],
 ['await atl.connect(ico).mint(owner.address, ethers.utils.parseEther("100"));',
  'await atl.connect(ico).unfreeze();',
  'await atl.approve(addr1.address, ethers.utils.parseEther("50"));',
  'await atl.connect(addr1).transferFrom(owner.address, addr2.address, '
  'ethers.utils.parseEther("50"));',
  'expect(await '
  'atl.balanceOf(addr2.address)).to.equal(ethers.utils.parseEther("50"));']]
"""
# test_cases = post_process_test_cases(extract_test_cases(test_code=original_test))
# pprint(test_cases)

# random_statements = [
#   'await atl.transfer(addr1.address, ethers.utils.parseEther("25"));',
#   'expect(await atl.balanceOf(owner.address)).to.equal(ethers.utils.parseEther("75"));',
#   'await atl.connect(addr1).transfer(addr2.address, ethers.utils.parseEther("10"));',
#   'await expect(atl.connect(addr2).transfer(owner.address, ethers.utils.parseEther("5"))).to.be.revertedWith("ERC20: transfer amount exceeds balance");',
#   'await atl.approve(addr1.address, ethers.utils.parseEther("100"));',
#   'expect(await atl.allowance(owner.address, addr1.address)).to.equal(ethers.utils.parseEther("100"));',
#   'await atl.connect(addr1).transferFrom(owner.address, addr2.address, ethers.utils.parseEther("50"));',
#   'expect(await atl.totalSupply()).to.equal(ethers.utils.parseEther("1000"));',
#   'await expect(atl.mint(addr1.address, ethers.utils.parseEther("100"))).to.emit(atl, "Transfer");',
#   'expect(await atl.symbol()).to.equal("ATL");',
#   'await expect(atl.connect(addr1).approve(addr2.address, 0)).to.emit(atl, "Approval");',
#   'await expect(atl.connect(addr1).transferFrom(owner.address, addr3.address, ethers.utils.parseEther("200"))).to.be.reverted;',
#   'expect(await atl.decimals()).to.equal(18);',
#   'await expect(atl.burn(ethers.utils.parseEther("50"))).to.emit(atl, "Transfer");',
#   'expect(await atl.name()).to.equal("AtlToken");',
# ]
#
# for s in random_statements:
#     print(update_test_case_expectancy(s))

NUM_ITERATIONS = 5
test_names_to_skip = ["2018-14084-test", "2018-17071-test", "2018-17877-test", "2018-19831-test"]

if __name__ == "__main__":
    from pathlib import Path

    input_dir = Path(__file__).parent / "test/test_generated"
    output_base = Path(__file__).parent / "test/random_search"
    output_base.mkdir(parents=True, exist_ok=True)

    for test_file in input_dir.glob("*.js"):
        test_name = test_file.stem  # 'ArithmeticTest' zonder '.js'
        if test_name in test_names_to_skip:
            print("SKIPPING:", test_name)
            continue

        current_test = test_file.read_text(encoding="utf-8")

        test_output_dir = output_base / test_name
        test_output_dir.mkdir(exist_ok=True)

        for nr in range(1, NUM_ITERATIONS+1):
            amplified_test = random_search_amplification(post_process_test_cases(extract_test_cases(test_code=current_test)), test_name, iterations=1)

            amplified = assemble_full_test_file(all_test_cases=amplified_test, original_test=current_test)

            output_path = test_output_dir / f"{test_name}-amplified-{nr}.js"
            output_path.write_text(amplified, encoding="utf-8")






