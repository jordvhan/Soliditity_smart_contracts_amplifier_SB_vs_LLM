if __name__ == "__main__":
    from parser import Parser
else:
    from .parser import Parser

from pprint import pprint
import re


class SolidityParser(Parser):

    def __init__(self, filepath):
        super().__init__(filepath)

    def parse_function_signature(self) -> None:
        """Parse a Solidity file to extract function names and parameter types."""
        with open(self.contract_filepath, "r") as f:
            content = f.read()

        function_pattern = r"function\s+(\w+)\s*\(([^)]*)\)"
        matches = re.findall(function_pattern, content)

        for match in matches:
            function_name = match[0]
            param_list = match[1]
            parameters = [tuple(param.split()) for param in param_list.split(",") if param.strip()]  # Extract types
            self.functions.append((function_name, parameters))


if __name__ == "__main__":
    # import os
    # print(os.getcwd())
    target_file = "../../../hardhat_testing/artifacts/working_setups/setup_erc721/contracts/token/ERC721/ERC721.sol"
    parser = SolidityParser(target_file)
    parser.parse_function_signature()
    pprint(parser.functions)
