import os
import re
from pprint import pprint

# Pad naar je testfolder
test_folder = "test"

def rename_tests(test_dir):
    test_counter = 1  # Start from test 1

    # Regex to match test names: it("some description", or it('some description',
    test_pattern = re.compile(r'it\((["\'])(.*?)(\1)')

    for filename in sorted(os.listdir(test_dir)):
        if filename.endswith('.js'):
            filepath = os.path.join(test_dir, filename)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()

            def replace_test_name(match):
                # global test_counter
                nonlocal test_counter
                new_name = f'test {test_counter}'
                test_counter += 1
                return f'it("{new_name}"'

            # Replace test names with incrementing names
            content = re.sub(test_pattern, replace_test_name, content)

            # Write back to file (overwrite)
            # write_filepath = os.path.join(destination_filepath, filename)
            with open(filepath, "w", encoding="utf-8") as file:
                file.write(content)

# def rename_tests(destination_filepath: str, current_test_folder: str):
#     # Doorloop alle .js-bestanden in de map
#     current_test_idx = -1
#
#     for js_test in os.listdir(current_test_folder):
#
#         if not js_test.endswith(".js"):
#             continue
#         else:
#             current_test_idx += 1
#
#         filepath = os.path.join(current_test_folder, js_test)
#
#         with open(filepath, "r", encoding="utf-8") as file:
#             content = file.read()
#
#         # Vervang `it("TEST x"` of `it('TEST x')` met `it.skip("TEST x")`
#         try:
#             # failsafe if test is empty
#             if 'it("test' not in content:
#                 current_test_idx -= 1  # test is skipped in output so idx shouldn't have increased
#                 continue
#
#             for test_number in failing_tests[current_test_idx]:
#                 test_name = "test " + str(test_number)
#                 pattern = re.compile(rf'\bit\(["\']{re.escape(test_name)}["\']')
#                 content = pattern.sub(f'it.skip("{test_name}"', content)
#
#             write_filepath = os.path.join(destination_filepath, js_test)
#             with open(write_filepath, "w", encoding="utf-8") as file:
#                 file.write(content)
#         except IndexError:
#             print(f'LOGGER: Index our of range for: {js_test}')
#             break


# find_failing_tests("full_output_rs.txt")
rename_tests("test")
