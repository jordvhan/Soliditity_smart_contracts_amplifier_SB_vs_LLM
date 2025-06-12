import ast
import inspect
import random
import os


class Parser:
    def __init__(self, contract_filepath):
        self.contract_filepath = contract_filepath
        self.functions = []
        self.extension = self.obtain_file_type()

    def obtain_file_type(self):
        # Remove all occurrences of '../' at the beginning
        filename = self.contract_filepath
        while filename.startswith('../'):
            filename = filename[3:]
        return filename.split('.')[1]

    def parse_function_signature(self) -> None:
        """Parse the file to extract function names and parameter types."""
        pass


