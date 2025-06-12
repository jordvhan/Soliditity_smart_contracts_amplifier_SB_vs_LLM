if __name__ == "__main__":
    from parser import Parser
else:
    from .parser import Parser

import ast
import re

class PythonParser(Parser):

    def __init__(self, filepath):
        super().__init__(filepath)

    def parse_function_signature(self) -> None:
        """Parse a Python file to extract function names and parameter types."""
        with open(self.contract_filepath, "r") as f:
            tree = ast.parse(f.read())

        for node in ast.walk(tree):
            if isinstance(node, ast.FunctionDef):
                function_name = node.name
                parameters = [arg.annotation for arg in node.args.args if arg.annotation]
                self.functions.append((function_name, parameters))



if __name__ == "__main__":
    target_file = "src/search_based_testing/parsers/solidity_parser.py"
    parser = PythonParser(target_file)
    parser.parse_function_signature()
    print(parser.functions)