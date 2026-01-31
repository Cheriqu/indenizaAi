
import os
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv("/var/www/indeniza/frontend/backend/.env")

OPENAI_KEY = os.getenv("OPENROUTER_API_KEY")
print(f"Key loaded: {bool(OPENAI_KEY)}")

client = OpenAI(
    base_url="https://openrouter.ai/api/v1", 
    api_key=OPENAI_KEY,
    timeout=30.0
)

models_to_test = [
    "google/gemini-2.0-flash-exp:free",
    "google/gemini-2.0-flash-thinking-exp:free",
    "google/gemini-exp-1206:free",
    "meta-llama/llama-3.2-3b-instruct:free",
    "huggingfaceh4/zephyr-7b-beta:free",
    "mistralai/mistral-7b-instruct:free",
    "microsoft/phi-3-mini-128k-instruct:free"
]

prompt = """Classifique JSON: {"categoria": "AEREO/NOMESUJO/BANCARIO/LUZ/TELEFONIA/OUTROS", "valido": true/false}. Texto: Tive um problema com voo cancelado."""

print(f"--- Starting Robust Test with {len(models_to_test)} models ---")

for model in models_to_test:
    print(f"\n🔄 Trying Model: {model}...")
    try:
        completion = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "user", "content": prompt}
            ],
            timeout=10.0 # Short timeout for testing
        )
        print("✅ SUCCESS!")
        print("Response:", completion.choices[0].message.content)
        break # Stop on first success
    except Exception as e:
        print(f"❌ Failed: {e}")
