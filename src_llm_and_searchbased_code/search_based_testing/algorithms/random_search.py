import random
import os

class RandomSearch:
    def __init__(self, seed=None):
        self.seed = seed
        if self.seed is not None:
            random.seed(self.seed)

    def generate_random_bytes(self, length):
        return random.randbytes(length)

    def generate_random_address(self):
        # Generate a random 20-byte address
        random_bytes = os.urandom(20)  # 20 bytes = 160 bits
        return '0x' + random_bytes.hex()  # Convert bytes to hex and prepend '0x'

    def generate_random_uint(self, size: int):
        return random.randint(0, 2 ** size - 1)

    def generate_random_bool(self):
        return random.choice([True, False])

    def generate_random_bytes_memory(self, length):
        return os.urandom(length)  # os.urandom() generates a secure random byte string

    def generate_random_input(self, _type):
        if _type == 'bytes4':
            return self.generate_random_bytes(length=4)
        elif _type == 'address':
            return self.generate_random_address()
        elif _type == 'uint128':
            return self.generate_random_uint(size=128)
        elif _type == 'uint256':
            return self.generate_random_uint(size=256)
        elif _type == 'bool':
            return self.generate_random_bool()
        elif _type == 'bytes memory':
            return self.generate_random_bytes_memory(32)
        else:
            raise ValueError(f"argument of type {_type} isn't implemented yet")

    def generate_random_inputs(self, function) -> tuple:
        """Generate random inputs for a parameter based on its annotation."""
        parameters = function[1]
        random_inputs = []
        for param in parameters:
            if len(param) == 1:
                raise ValueError(f"parameter {param} of function {function[0]} is incorrectly parsed")
            elif len(param) == 2:
                random_inputs.append(self.generate_random_input(_type=param[0]))
            elif len(param) == 3:
                random_inputs.append(self.generate_random_input(_type=param[0]+" "+param[1]))

        ret_val = (function[0], random_inputs)
        return ret_val
