import copy
import subprocess
import random
import re
from typing import List, Tuple
import time
import os
from pprint import pprint


def weighted_choice(prob):
    return random.random() < prob


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
    mutated_values = []

    def replace_with_smart_value(match):
        num_type = random.choice(["int", "int"])  # Randomly decide between int and float

        value = None
        if num_type == "int":
            # Smart mutations for integers
            # mutation_type = random.choice(["valid", "zero", "large", "boundary"])
            # mutation_type = random.choice(["valid", "negative", "zero", "large", "boundary"])
            mutation_type = random.choices(
                ["valid", "negative", "zero", "large", "boundary"],
                weights=[31, 12, 19, 19, 19],
                k=1
            )[0]

            if mutation_type == "valid":
                value = str(random.randint(1, 100))  # Random integer between 1 and 1000
            elif mutation_type == "negative":
                value = str(random.randint(-100, -1))  # Negative integer
            elif mutation_type == "zero":
                value = "0"  # Test edge case with zero
            elif mutation_type == "large":
                value = str(random.randint(1000000, 1000000000))  # Large number
            elif mutation_type == "boundary":
                value = str(random.choice([2 ** 31 - 1, 2 ** 31 - 1]))
                # return str(random.choice([2 ** 31 - 1, -2 ** 31]))  # Edge case for boundary of int32
        else:
            # Smart mutations for floats
            mutation_type = random.choice(["valid", "negative", "zero", "large", "boundary"])

            if mutation_type == "valid":
                value = str(round(random.uniform(1.0, 1000.0), 2))  # Valid float between 1.0 and 1000.0
            elif mutation_type == "negative":
                value = str(round(random.uniform(-1000.0, -1.0), 2))  # Negative float
            elif mutation_type == "zero":
                value = "0.0"  # Zero float
            elif mutation_type == "large":
                value = str(round(random.uniform(1000000.0, 1000000000.0), 2))  # Large float
            elif mutation_type == "boundary":
                value = str(
                    random.choice([float('-inf'), float('inf'), float('nan')]))  # Boundary float values (NaN, Inf)
        mutated_values.append(value)
        return value

    mutated_test = re.sub(r'\b\d+\.\d+\b|\b\d+\b', replace_with_smart_value, test_case)  # Match integers and floats
    try:
        return mutated_test, mutated_values[0]
    except:
        return mutated_test, None


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


def update_test_case_correlations(full_test_case: list, updated_line_idx, correlations, value):
    """
    directly modify the test to update all values that depended on the mutated value
    :param full_test_case: processed representation of the test where the mutation occurred
    :param updated_line_idx: line index within the test where the mutation occurred
    :param correlations: all correlations that other values had to the mutated value
    :param value: value that was mutated
    :return: Nothing (the test is updated directly in this method and doesn't need to be returned)
    """
    for correlation in correlations:
        # don't worry about lines that aren't updated
        if correlation['input_line'] != updated_line_idx:
            continue

        line_to_update = correlation['assert_line']
        if correlation['relation'] == 'direct':
            full_test_case[line_to_update] = re.sub(r'\b\d+\.\d+\b|\b\d+\b', value, full_test_case[line_to_update])
        elif correlation['relation'] == 'sub_from_initial':
            updated_value = str(correlation['initial_supply'] - int(value))
            full_test_case[line_to_update] = re.sub(r'\b\d+\.\d+\b|\b\d+\b', updated_value,
                                                    full_test_case[line_to_update])


def extract_integers(js_line: str) -> List[str]:
    return re.findall(r'\b\d+\b', js_line)

def extract_floats(js_line: str) -> List[str]:
    return re.findall(r'\b\d+\.\d+|\b\d+\b', js_line)

def replace_integers(js_line: str, new_ints: List[str]) -> str:
    def replacer(match):
        return new_ints.pop(0)

    return re.sub(r'\b\d+\b', replacer, js_line)

def replace_floats(js_line: str, new_vals: List[str]) -> str:
    def replacer(match):
        return new_vals.pop(0)

    # This pattern matches floats (like .5, 0.5, 5., 5.0) and integers
    pattern = r'\b\d+\.\d+|\b\d+\b|\B\.\d+\b'  # handles 0.5, .5, 5.0 and 5
    return re.sub(pattern, replacer, js_line)


def crossover_integers(line1: str, line2: str) -> tuple[str, str, str, str]:
    ints1 = extract_integers(line1)
    ints2 = extract_integers(line2)

    if len(ints1) != len(ints2):
        raise ValueError("Integer counts don't match between lines.")

    if len(ints1) == 1:
        i1 = int(ints1[0])
        i2 = int(ints2[0])
        # Arithmetic crossover
        child1_ints = [str((i1 + i2) // 2)]
        child2_ints = [str(abs(i1 - i2))]
    else:
        # Uniform crossover
        child1_ints = [random.choice([i1, i2]) for i1, i2 in zip(ints1, ints2)]
        child2_ints = [random.choice([i1, i2]) for i1, i2 in zip(ints1, ints2)]

    new_line1 = replace_integers(line1, child1_ints.copy())
    new_line2 = replace_integers(line2, child2_ints.copy())

    return new_line1, new_line2, child1_ints.copy()[0], child2_ints.copy()[0]


def crossover_float(line1: str, line2: str) -> tuple[str, str, str, str]:
    fl1 = extract_floats(line1)
    fl2 = extract_floats(line2)

    if len(fl1) != len(fl2):
        raise ValueError("float counts don't match between lines.")

    if len(fl1) == 1:
        i1 = float(fl1[0])
        i2 = float(fl2[0])
        # Arithmetic crossover
        child1_ints = [str((i1 + i2) / 2)]
        child2_ints = [str(abs(i1 - i2))]

    else:
        # Uniform crossover
        child1_ints = [random.choice([i1, i2]) for i1, i2 in zip(fl1, fl2)]
        child2_ints = [random.choice([i1, i2]) for i1, i2 in zip(fl1, fl2)]

    new_line1 = replace_floats(line1, child1_ints.copy())
    new_line2 = replace_floats(line2, child2_ints.copy())

    return new_line1, new_line2, child1_ints.copy()[0], child2_ints.copy()[0]

def crossover(line1, line2):
    # if the length of the integer list is 1 or more, then we are dealing with integers
    ints1 = extract_integers(line1)
    ints2 = extract_integers(line2)
    has_integer = len(extract_integers(line1)) > 0

    # int with int crossover
    if has_integer and (len(ints1) == len(ints2)):
        return crossover_integers(line1, line2)

    # float with int crossover
    elif has_integer and (len(ints1) != len(ints2)):
        fl1 = extract_floats(line1)
        fl2 = extract_floats(line2)
        if len(fl1) == len(fl2):
            return crossover_float(line1, line2)
        else:
            a = 2

    # no integer crossover is possible
    else:
        return line1, line2


def identify_mutated_line(original_test: list, mutated_test: list, correlations) -> int:
    for cor in correlations:
        line_to_check = cor['input_line']
        if original_test[line_to_check] != mutated_test[line_to_check]:  # if the mutated line is found, return it
            return line_to_check
    return -1  # if no mutated line is found somehow, return -1 to show that tests are identical


def genetic_search_amplification_crossover(original_test_cases: list, amplified_test_cases: list, correlations):
    """Perform genetic search to amplify the test case."""

    # Run the tests with Hardhat
    # base_output = run_hardhat_test()
    all_tests = []
    ctr = -1
    amplified_idx_ctr = -1
    for test_case in original_test_cases:
        ctr += 1
        amplified_idx_ctr += 1
        if len(correlations[ctr]) == 0:
            all_tests.append(test_case)
            continue  # no correlations so no crossover can happen

        # increase it once more because if you are here, a mutation has happened previously due to a correlation
        amplified_test1 = amplified_test_cases[amplified_idx_ctr]
        amplified_idx_ctr += 1
        amplified_test2 = amplified_test_cases[amplified_idx_ctr]

        # find the index of the mutated line. This is needed because crossover without mutated lines is like
        # doing crossover with the same test twice so there is nothing to crossover on
        mutated_line_idx = identify_mutated_line(test_case, amplified_test1, correlations[ctr])

        # perform crossover
        new_line1_1, new_line1_2, int1_1, int1_2 = crossover(test_case[mutated_line_idx],
                                                             amplified_test1[mutated_line_idx])
        new_line2_1, new_line2_2, int2_1, int2_2 = crossover(test_case[mutated_line_idx],
                                                             amplified_test2[mutated_line_idx])

        # update the new crossover lines with 4 new tests (crossover generates 2 lines per mutation)
        new_test_case1 = copy.deepcopy(test_case)
        new_test_case1[mutated_line_idx] = new_line1_1
        update_test_case_correlations(new_test_case1, mutated_line_idx, correlations[ctr], int1_1)

        new_test_case2 = copy.deepcopy(test_case)
        new_test_case2[mutated_line_idx] = new_line1_2
        update_test_case_correlations(new_test_case2, mutated_line_idx, correlations[ctr], int1_2)

        new_test_case3 = copy.deepcopy(test_case)
        new_test_case3[mutated_line_idx] = new_line2_1
        update_test_case_correlations(new_test_case3, mutated_line_idx, correlations[ctr], int2_1)

        new_test_case4 = copy.deepcopy(test_case)
        new_test_case4[mutated_line_idx] = new_line2_2
        update_test_case_correlations(new_test_case4, mutated_line_idx, correlations[ctr], int2_2)

        # add them to all tests
        all_tests.extend([new_test_case1, new_test_case2, new_test_case3, new_test_case4])

    full_test = assemble_test_cases(all_tests)

    return full_test


"""
[{'assert_line': 1,
   'assert_value': 100.0,
   'input_line': 0,
   'input_value': 100.0,
   'relation': 'direct'},
  {'assert_line': 2,
   'assert_value': 900.0,
   'initial_supply': 1000,
   'input_line': 0,
   'input_value': 100.0,
   'relation': 'sub_from_initial'}]
"""


def genetic_search_amplification_mutation(original_test_cases: list, correlations):
    """Perform genetic search to amplify the test case."""

    # Run the tests with Hardhat
    # base_output = run_hardhat_test()
    all_tests = []
    ctr = -1
    for test_case in original_test_cases:
        ctr += 1
        if len(correlations[ctr]) == 0:
            all_tests.append(test_case)
            continue  # no correlations so no mutation can happen

        selected_mutation_dependency = random.choice(correlations[ctr])
        test_case_line_idx = selected_mutation_dependency['input_line']
        test_case_line = test_case[test_case_line_idx]
        mutated_line, value = make_smart_mutation(test_case_line)

        # if the same mutation happened (for example INT LIMIT)
        if mutated_line == test_case_line:
            # 1000 attempts to make a unique mutation, usually 1 is already sufficient
            # so 1000 to make sure it basically ALWAYS works
            for i in range(1000):
                mutated_line, value = make_smart_mutation(test_case_line)

                if mutated_line == test_case_line:
                    continue
                else:
                    break

        # copy the original test and add the mutated line in the correct spot
        new_test_cases = copy.deepcopy(test_case)
        new_test_cases[test_case_line_idx] = mutated_line

        # update the mutation counter (just '== 1' for now)
        mutation_ctr = 0
        if mutated_line != test_case_line:
            mutation_ctr += 1

            # update value in dependencies IF mutation occurred
            if value is not None:
                update_test_case_correlations(new_test_cases, test_case_line_idx, correlations[ctr], value)
        else:
            raise ValueError("no mutation occurred")

        new_test_cases_expanded = [[] for _ in range(2 ** mutation_ctr)]
        n = len(new_test_cases_expanded)  # should ALWAYS be 2 if mutation_ctr == 1
        alternation = 1
        alternation_ctr = 0
        mode = True
        for i in range(len(test_case)):
            if test_case[i] == new_test_cases[i]:
                for j in range(n):
                    new_test_cases_expanded[j].append(test_case[i])
            elif i in [cor['assert_line'] for cor in correlations[ctr] if cor[
                                                                              'input_line'] == test_case_line_idx]:  # same body as previous if statement but used for readability
                for j in range(n):
                    new_test_cases_expanded[j].append(new_test_cases[i])
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


def extract_test_cases_beforeEach(test_code):
    # Vind de inhoud van het beforeEach-blok
    before_each_match = re.search(r"beforeEach\s*\([^)]*\)\s*{([\s\S]*?)}", test_code)
    if not before_each_match:
        return 0

    before_each_body = before_each_match.group(1)

    # Zoek naar deploy() en verzamel de argumenten
    deploy_match = re.search(r"deploy\s*\(\s*([^\)]*)\)", before_each_body)
    if not deploy_match:
        return 0

    args_str = deploy_match.group(1)
    args = [arg.strip() for arg in args_str.split(',')]

    if not args:
        return 0

    # Kijk of eerste argument een getal of string met getal is
    first_arg = args[0]
    number_match = re.match(r'^"(\d+)"$|^(\d+)$', first_arg)
    if not number_match:
        return 0

    return int(number_match.group(1) or number_match.group(2))


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

# pprint(post_process_test_cases(extract_test_cases(test_code=original_test_small)))
# Run random search to amplify the test
# amplified_test = genetic_search_amplification(post_process_test_cases(extract_test_cases(test_code=original_test_big)), original_test_name, iterations=1)

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

# NUM_ITERATIONS = 1
#
# if __name__ == "__main__":
#     from pathlib import Path
#
#     input_dir = Path(__file__).parent / "tests_to_amplify"
#     output_base = Path(__file__).parent / "test/genetic_search"
#     output_base.mkdir(parents=True, exist_ok=True)
#
#     for test_file in input_dir.glob("*.js"):
#         test_name = test_file.stem  # 'ArithmeticTest' zonder '.js'
#         current_test = test_file.read_text(encoding="utf-8")
#
#         test_output_dir = output_base / test_name
#         test_output_dir.mkdir(exist_ok=True)
#
#         for nr in range(1, NUM_ITERATIONS+1):
#             amplified_test = random_search_amplification(post_process_test_cases(extract_test_cases(test_code=current_test)), test_name, iterations=1)
#
#             amplified = assemble_full_test_file(all_test_cases=amplified_test, original_test=current_test)
#
#             output_path = test_output_dir / f"{test_name}-amplified-{nr}.js"
#             output_path.write_text(amplified, encoding="utf-8")


def extract_numbers(line):
    """Extract numbers from a line, including ethers.parseEther('...') cases."""
    numbers = []
    ether_match = re.findall(r'ethers\.parseEther\(["\'](\d+(\.\d+)?)["\']\)', line)
    plain_match = re.findall(r'[^a-zA-Z0-9](\d+(\.\d+)?)[^a-zA-Z0-9]', ' ' + line + ' ')
    if ether_match:
        numbers.extend([float(m[0]) for m in ether_match])
    if plain_match:
        numbers.extend([float(m[0]) for m in plain_match])
    return numbers


def find_correlations(lines, initial_supply=None):
    inputs = []
    outputs = []

    for line in lines:
        nums = extract_numbers(line)
        if 'expect' in line:
            outputs.extend(nums)
        else:
            inputs.extend(nums)

    correlations = []

    # Check for direct matches and subtraction from initial supply
    for out in outputs:
        if out in inputs:
            correlations.append(f"{out} correlates with direct input {out}")
        elif initial_supply is not None and any(initial_supply - i == out for i in inputs):
            i = [i for i in inputs if initial_supply - i == out][0]
            correlations.append(f"{out} correlates with initial supply ({initial_supply}) - {i}")

    return correlations


def find_correlations_structured(lines, initial_supply=None):
    inputs = []
    outputs = []
    correlations = []

    # Track line numbers
    for i, line in enumerate(lines):
        nums = extract_numbers(line)
        if 'expect' in line:
            for num in nums:
                outputs.append((i, num))
        else:
            for num in nums:
                inputs.append((i, num))

    for out_line, out_val in outputs:
        for in_line, in_val in inputs:
            if out_val == in_val:
                correlations.append({
                    "input_line": in_line,
                    "assert_line": out_line,
                    "relation": "direct",
                    "input_value": in_val,
                    "assert_value": out_val
                })
            elif initial_supply is not None and initial_supply - in_val == out_val:
                correlations.append({
                    "input_line": in_line,
                    "assert_line": out_line,
                    "relation": "sub_from_initial",
                    "input_value": in_val,
                    "assert_value": out_val,
                    "initial_supply": initial_supply
                })
    return correlations


def remove_duplicate_correlations(correlations):
    return [list({tuple(sorted(d.items())): d for d in inner}.values()) for inner in correlations]


def assemble_full_generation(*lists, original_test):
    all_tests = []
    for lst in lists:
        all_tests.extend(lst)

    full_test = assemble_test_cases(all_tests)
    return assemble_full_test_file(all_test_cases=full_test, original_test=original_test)


test_case_with_beforeEach = """
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Token Contract", function () {
  let Token, token, owner, controller, addr1, addr2, vault;

  beforeEach(async function () {
    [owner, controller, addr1, addr2, vault] = await ethers.getSigners();
    Token = await ethers.getContractFactory("contracts/2018-10706.sol:Token");
    token = await Token.deploy(
      1000, // initialSupply
      "TestToken", // tokenName
      18, // decimalUnits
      "TTK", // tokenSymbol
      vault.address // vaultAddress
    );
  });

  it("test 1", async function () {
    expect(await token.owner()).to.equal(owner.address);
    expect(await token.totalSupply()).to.equal(ethers.parseEther("1000"));
    expect(await token.balanceOf(owner.address)).to.equal(ethers.parseEther("1000"));
  });

  it("test 2", async function () {
    await token.transfer(addr1.address, ethers.parseEther("100"));
    expect(await token.balanceOf(addr1.address)).to.equal(ethers.parseEther("100"));
    expect(await token.balanceOf(owner.address)).to.equal(ethers.parseEther("900"));
  });

  it("test 3", async function () {
    await expect(
      token.connect(addr1).transfer(addr2.address, ethers.parseEther("1"))
    ).to.be.reverted;
  });

  it("test 4", async function () {
    await token.approve(addr1.address, ethers.parseEther("50"));
    expect(await token.allowance(owner.address, addr1.address)).to.equal(ethers.parseEther("50"));

    await token.connect(addr1).transferFrom(owner.address, addr2.address, ethers.parseEther("50"));
    expect(await token.balanceOf(addr2.address)).to.equal(ethers.parseEther("50"));
    expect(await token.balanceOf(owner.address)).to.equal(ethers.parseEther("950"));
  });

    it("test 5", async function () {
      // Set the controller address
      await token.changeController(controller.address);
    
      // Ensure addr1 has sufficient balance
      const initialBalance = await token.balanceOf(addr1.address);
      const freezeAmount = 50;
    
      // Check if addr1 has enough balance to freeze
      if (initialBalance<freezeAmount) {
        await token.connect(controller).generateTokens(addr1.address, 100); // Generate some tokens for testing if necessary
      }
    
      // Freeze addr1's tokens
      await token.connect(controller).freeze(addr1.address, freezeAmount, 0);
      // on line 56 generate 100 tokens and freeze costs 50 so total is 100-50
      expect(await token.balanceOf(addr1.address)).to.equal(ethers.parseEther("50"));
    
      // Unfreeze addr1's tokens
      await token.connect(owner).unFreeze(0);
      expect(await token.balanceOf(addr1.address)).to.equal(ethers.parseEther(freezeAmount.toString())+ethers.parseEther("50"));
    });


  it("test 6", async function () {
    await token.changeController(controller.address);

    await token.connect(controller).generateTokens(addr1.address, 1000);
    expect(await token.balanceOf(addr1.address)).to.equal(ethers.parseEther("1000"));

    await token.destroyTokens(addr1.address, 50);
    expect(await token.balanceOf(addr1.address)).to.equal(ethers.parseEther("950"));
  });

  it("test 7", async function () {
    await token.changeTokensPerEther(20000);
    expect(await token.tokensPerEther()).to.equal(20000);

    await token.changeAirdropQty(20);
    expect(await token.airdropQty()).to.equal(20);

    await token.changePaused(true);
    expect(await token.paused()).to.equal(true);
  });

  it("test 8", async function () {
    await token.changeOwner(addr1.address);
    expect(await token.owner()).to.equal(addr1.address);
  });
});

"""

GENERATION = 2
test_names_to_skip = ["2018-14084-test", "2018-17071-test", "2018-17877-test", "2018-19831-test"]

if __name__ == "__main__":
    from pathlib import Path

    if GENERATION == 1:
        input_dir = Path(__file__).parent / "test/claude"
        output_base = Path(__file__).parent / f"test/genetic_search/generation{GENERATION}"
    else:
        input_dir = Path(__file__).parent / f"test/genetic_search/success_generation{GENERATION - 1}"
        output_base = Path(__file__).parent / f"test/genetic_search/generation{GENERATION}"

    output_base.mkdir(parents=True, exist_ok=True)

    for test_file in input_dir.glob("*.js"):
        test_name = test_file.stem  # 'ArithmeticTest' zonder '.js'
        if test_name in test_names_to_skip:
            print("SKIPPING:", test_name)
            continue

        test_name = test_name.split('-amplified')[0]
        current_test = test_file.read_text(encoding="utf-8")

        test_output_dir = output_base
        test_output_dir.mkdir(exist_ok=True)

        # AMPLIFICATION STARTS HERE
        # process the initial test and get start supply if any
        original_test_processed = post_process_test_cases(extract_test_cases(test_code=current_test))
        initial_supply = extract_test_cases_beforeEach(current_test)

        # find all correlations
        all_correlations = []
        for original_processed_test in original_test_processed:
            correlations = find_correlations_structured(original_processed_test, initial_supply)
            all_correlations.append(correlations)

        # correlations are found both ways, but you need to keep them only one-way
        all_correlations = remove_duplicate_correlations(all_correlations)

        # mutated testcases
        amplified_test = genetic_search_amplification_mutation(original_test_processed, all_correlations)

        # full mutated testfile
        amplified_mutated = assemble_full_test_file(all_test_cases=amplified_test, original_test=current_test)

        # processed tests for crossover algorithm
        processed_mutated_tests = post_process_test_cases(extract_test_cases(test_code=amplified_mutated))

        # perform crossover
        amplified_test_final = genetic_search_amplification_crossover(original_test_processed, processed_mutated_tests,
                                                                      all_correlations)

        # full mutated and crossover testfile
        amplified_mutated_crossover = assemble_full_test_file(all_test_cases=amplified_test_final,
                                                              original_test=current_test)

        # process the testcases for the final test
        processed_mutated_tests_final = post_process_test_cases(
            extract_test_cases(test_code=amplified_mutated_crossover))

        # combine all tests from the original generation, mutation and crossover
        final_test = assemble_full_generation(original_test_processed, processed_mutated_tests, processed_mutated_tests_final,
                                     original_test=current_test)

        output_path = test_output_dir / f"{test_name}-amplified.js"
        output_path.write_text(final_test, encoding="utf-8")


# initial_supply = extract_test_cases_beforeEach(test_case_with_beforeEach)
# processed_tests = post_process_test_cases(extract_test_cases(test_code=test_case_with_beforeEach))
#
# all_correlations = []
# for processed_test in processed_tests:
#     # correlations = find_correlations(processed_test, initial_supply)
#     correlations = find_correlations_structured(processed_test, initial_supply)
#     # pprint(correlations)
#     # print(type(correlations))
#     all_correlations.append(correlations)
#
# all_correlations = remove_duplicate_correlations(all_correlations)
# # pprint(all_correlations)
#
# # mutated testcases
# amplified_test = genetic_search_amplification_mutation(processed_tests, all_correlations)
# # print(amplified_test)
#
# # full mutated testfile
# amplified = assemble_full_test_file(all_test_cases=amplified_test, original_test=test_case_with_beforeEach)
# # print(amplified)
#
# # processed tests for crossover algorithm
# processed_mutated_tests = post_process_test_cases(extract_test_cases(test_code=amplified))
#
# # perform crossover
# amplified_test_final = genetic_search_amplification_crossover(processed_tests, processed_mutated_tests,
#                                                               all_correlations)
#
# amplified2 = assemble_full_test_file(all_test_cases=amplified_test_final, original_test=test_case_with_beforeEach)
# # print(amplified2)
#
# processed_mutated_tests_final = post_process_test_cases(extract_test_cases(test_code=amplified2))
#
# a = assemble_full_generation(processed_tests, processed_mutated_tests, processed_mutated_tests_final,
#                              original_test=test_case_with_beforeEach)
# print(a)

# if __name__ == "__main__":
#     from pathlib import Path
#
#     input_dir = Path(__file__).parent / "tests_to_amplify"
#
#     for test_file in input_dir.glob("*.js"):
#         current_test = test_file.read_text(encoding="utf-8")
#         print(extract_test_cases_beforeEach(current_test))
