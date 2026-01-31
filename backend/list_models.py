
import os
import requests
from dotenv import load_dotenv

load_dotenv("/var/www/indeniza/frontend/backend/.env")

key = os.getenv("OPENROUTER_API_KEY")
print(f"Key loaded: {bool(key)}")

if not key:
    print("❌ No key found in .env")
    exit(1)

try:
    response = requests.get(
        "https://openrouter.ai/api/v1/models",
        headers={"Authorization": f"Bearer {key}"},
        timeout=10
    )
    
    if response.status_code == 200:
        data = response.json()
        all_models = data.get("data", [])
        print(f"Total models found: {len(all_models)}")
        
        free_models = [m["id"] for m in all_models if ":free" in m["id"] or "free" in m.get("pricing", {}).get("prompt", "")]
        # Also check for explict :free syntax in ID which is common for OpenRouter free tier
        explicit_free = [m["id"] for m in all_models if m["id"].endswith(":free")]
        
        print("\n--- Available ':free' Models ---")
        for m in explicit_free:
            print(m)
            
        print("\n--- Other Potential Free Models ---")
        # Just printing first 10 for brevity if list is huge
        count = 0
        for m in free_models:
            if m not in explicit_free:
                print(m)
                count += 1
                if count >= 10: break
                
    else:
        print(f"❌ API Request failed: {response.status_code} - {response.text}")

except Exception as e:
    print(f"❌ Error: {e}")
