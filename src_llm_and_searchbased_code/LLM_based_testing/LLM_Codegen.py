import os
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig

# Load a free open-source model
MODEL_NAME = "Salesforce/codegen-6B-mono"


def limit_gpu_memory(fraction=0.5):
    if torch.cuda.is_available():
        torch.cuda.set_per_process_memory_fraction(fraction, torch.cuda.current_device())
        torch.cuda.empty_cache()


print("Loading model... This may take some time.")
tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)

bnb_config = BitsAndBytesConfig(
    load_in_8bit=True  # Enables 8-bit inference
)

model = AutoModelForCausalLM.from_pretrained(
    MODEL_NAME,
    torch_dtype=torch.float16,
    device_map="auto",
    quantization_config=bnb_config  # Apply 8-bit quantization
)

# Limit GPU memory to 50%
limit_gpu_memory(0.5)


def generate_code(contract_code, test_code):
    prompt = f"""
    Here is a Solidity smart contract:
    {contract_code}

    Here is the existing JavaScript test file:
    {test_code}

    Write additional junit tests in JavaScript to improve coverage of the Solidity contract.
    """

    inputs = tokenizer(prompt, return_tensors="pt").to("cuda" if torch.cuda.is_available() else "cpu")

    with torch.no_grad():
        outputs = model.generate(**inputs, max_length=512, temperature=0.7, top_p=0.9)

    generated_text = tokenizer.decode(outputs[0], skip_special_tokens=True)

    # Remove any repetition of the input prompt
    #generated_text = generated_text.replace(prompt.strip(), "").strip()

    print("Generated Code:\n")
    print(generated_text)


# Example usage
contract_code = "../../hardhat_testing/contracts/token.sol"
test_code = "../../hardhat_testing/test/TokenTest.js"

generate_code(contract_code, test_code)
