import os
import re
from pprint import pprint

# Pad naar je testfolder
test_folder = "test"


def find_failing_tests(output_file: str) -> list:
    with open(output_file, "r", encoding="utf-8") as file:
        content = file.readlines()

    tests_to_skip = []
    mode = 0
    test_idx = 0
    test_names = []
    tests_per_file = []
    contract_checked = False

    for line in content:
        # run until general overview
        if 'passing(' in line.replace(' ', '').replace('\t', ''):
            break

        # start from here
        if '> network:    hardhat' in line:
            mode = 1

        if mode == 0:
            continue

        if contract_checked == False:
            # print(line)
            if 'network:' not in line: test_names.append(line.strip())

        line = line.strip()
        if line == "":
            if len(tests_per_file) != 0:
                tests_to_skip.append(tests_per_file)
                tests_per_file = []
                contract_checked = False
            else:
                if contract_checked:
                    tests_to_skip.append(tests_per_file)  # this will be empty
                    tests_per_file = []
                    contract_checked = False
            continue

        if not line.startswith('✔') and " test " in line:
            parts = line.split(' test ')
            if len(parts) > 1:
                try:
                    test_num = int(parts[1].strip())
                    tests_per_file.append(test_num)
                    mode += 1
                except ValueError:
                    pass  # not a number, skip this line


        if line != "" and 'network:' not in line:
            contract_checked = True


    print(f"LOGGER: {mode-1} tests failed!")
    del test_names[0]
    del test_names[0]
    del test_names[0]
    del test_names[-1]
    # a = dict(zip(test_names, tests_to_skip))

    # from collections import defaultdict
    #
    # counter = defaultdict(int)
    # result = {}
    #
    # for name, values in zip(test_names, tests_to_skip):
    #     counter[name] += 1
    #     key = f"{name}_{counter[name]}"
    #     result[key] = values
    #
    # for r in result.keys():
    #     print(f'contract {r} has following tests disabled:')
    #     print(f'{result[r]}')
    #     print()

    # print(len(test_names))
    # print(len(tests_to_skip))
    return tests_to_skip


def disable_tests(failing_tests: list, destination_filepath: str):
    # Doorloop alle .js-bestanden in de map
    current_test_idx = -1
    for subfolder_name in os.listdir(test_folder):

        current_test_folder = test_folder + "/" + subfolder_name

        for js_test in os.listdir(current_test_folder):

            if not js_test.endswith(".js"):
                continue
            else:
                current_test_idx += 1

            filepath = os.path.join(current_test_folder, js_test)

            with open(filepath, "r", encoding="utf-8") as file:
                content = file.read()

            # Vervang `it("TEST x"` of `it('TEST x')` met `it.skip("TEST x")`
            try:
                # failsafe if test is empty
                if 'it("test' not in content:
                    current_test_idx -= 1  # test is skipped in output so idx shouldn't have increased
                    continue

                for test_number in failing_tests[current_test_idx]:
                    test_name = "test " + str(test_number)
                    pattern = re.compile(rf'\bit\(["\']{re.escape(test_name)}["\']')
                    content = pattern.sub(f'it.skip("{test_name}"', content)

                write_filepath = os.path.join(destination_filepath, js_test)
                with open(write_filepath, "w", encoding="utf-8") as file:
                    file.write(content)
            except IndexError:
                print(f'LOGGER: Index our of range for: {js_test}')
                break


def disable_tests_same_folder(failing_tests: list, destination_filepath: str, current_test_folder: str):
    # Doorloop alle .js-bestanden in de map
    current_test_idx = -1

    for js_test in os.listdir(current_test_folder):

        if not js_test.endswith(".js"):
            continue
        else:
            current_test_idx += 1

        filepath = os.path.join(current_test_folder, js_test)

        with open(filepath, "r", encoding="utf-8") as file:
            content = file.read()

        # Vervang `it("TEST x"` of `it('TEST x')` met `it.skip("TEST x")`
        try:
            # failsafe if test is empty
            if 'it("test' not in content:
                current_test_idx -= 1  # test is skipped in output so idx shouldn't have increased
                continue

            for test_number in failing_tests[current_test_idx]:
                test_name = "test " + str(test_number)
                pattern = re.compile(rf'\bit\(["\']{re.escape(test_name)}["\']')
                content = pattern.sub(f'it.skip("{test_name}"', content)

            write_filepath = os.path.join(destination_filepath, js_test)
            with open(write_filepath, "w", encoding="utf-8") as file:
                file.write(content)
        except IndexError:
            print(f'LOGGER: Index our of range for: {js_test}')
            break


# find_failing_tests("full_output_rs.txt")
# disable_tests(find_failing_tests("claude_3_7_full_best.txt"), "test/claude_3_7_full_best")
disable_tests_same_folder(find_failing_tests("hybrid_llm_then_search_gen2.txt"), "test/genetic_search/success_generation2", "test/genetic_search/generation2")
