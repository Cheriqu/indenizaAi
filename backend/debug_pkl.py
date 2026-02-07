import pickle
import pandas as pd
from pathlib import Path

PKL_PATH = Path("/var/www/indeniza/backend/banco_aereo.pkl")

with open(PKL_PATH, "rb") as f:
    data = pickle.load(f)

df = data["dataframe"]
vectors = data["vetores"]

print(f"DataFrame shape: {df.shape}")
print(f"Vectors shape: {vectors.shape}")
