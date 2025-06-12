from pprint import pprint

from parsers.solidity_parser import SolidityParser
from algorithms.random_search import RandomSearch

if __name__ == '__main__':
    target_file = "../../hardhat_testing/artifacts/working_setups/setup_erc721/contracts/token/ERC721/ERC721.sol"
    parser = SolidityParser(target_file)
    parser.parse_function_signature()
    pprint(parser.functions)

    print("\n---\n")

    rs = RandomSearch(seed=2)

    random_inputs = []
    for function in parser.functions:
        random_inputs.append(rs.generate_random_inputs(function))

    pprint(random_inputs)

