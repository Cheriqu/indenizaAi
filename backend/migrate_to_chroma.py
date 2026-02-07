import os
import pickle
import chromadb
import pandas as pd
from pathlib import Path

# Configurações
CURRENT_DIR = Path(__file__).resolve().parent
DB_DIR = CURRENT_DIR
CHROMA_DB_DIR = DB_DIR / "chroma_db"

# Inicializa ChromaDB (Persistente)
print(f"📂 Criando/Abrindo banco ChromaDB em: {CHROMA_DB_DIR}")
client = chromadb.PersistentClient(path=str(CHROMA_DB_DIR))

def migrate_pkl(filename, collection_name):
    pkl_path = DB_DIR / filename
    if not pkl_path.exists():
        print(f"⚠️ Arquivo {filename} não encontrado. Pulando.")
        return

    print(f"🚀 Migrando {filename} para coleção '{collection_name}'...")
    
    try:
        with open(pkl_path, "rb") as f:
            data = pickle.load(f)
        
        df = data["dataframe"]
        vectors = data["vetores"]
        
        # Garante colunas numéricas
        if "valor_dano_moral" not in df.columns: df["valor_dano_moral"] = 0
        if "valor_dano_material" not in df.columns: df["valor_dano_material"] = 0
        df["valor_dano_moral"] = pd.to_numeric(df["valor_dano_moral"], errors="coerce").fillna(0)
        df["valor_dano_material"] = pd.to_numeric(df["valor_dano_material"], errors="coerce").fillna(0)
        df["valor_total"] = df["valor_dano_moral"] + df["valor_dano_material"]
        
        # CRITICAL FIX: Reset index to align with vectors array (0-based)
        df = df.reset_index(drop=True)
        
        # Garante que vetores e df tenham mesmo tamanho (corta excesso)
        min_len = min(len(df), len(vectors))
        df = df.iloc[:min_len]
        vectors = vectors[:min_len]

        # Cria/Reseta coleção
        try: client.delete_collection(collection_name)
        except: pass
        collection = client.create_collection(name=collection_name)

        # Prepara dados para inserção em lote (batch)
        batch_size = 500
        total = len(df)
        
        ids = []
        embeddings = []
        documents = []
        metadatas = []

        for idx, row in df.iterrows():
            ids.append(f"{collection_name}_{idx}")
            embeddings.append(vectors[idx].tolist()) # Chroma precisa de lista, não numpy
            documents.append(row.get("texto_para_embedding", ""))
            
            # Metadata (somente tipos primitivos)
            meta = {
                "resumo": str(row.get("resumo", ""))[:1000], # Limita tamanho
                "data_julgamento": str(row.get("data_julgamento", "")),
                "resultado": str(row.get("resultado", "")),
                "valor_total": float(row.get("valor_total", 0)),
                "link": str(row.get("link_acordao") or row.get("link_teor") or row.get("link") or "#")
            }
            metadatas.append(meta)

        # Inserção em lotes
        for i in range(0, total, batch_size):
            end = min(i + batch_size, total)
            print(f"   ↳ Inserindo lote {i} a {end}...")
            collection.add(
                ids=ids[i:end],
                embeddings=embeddings[i:end],
                documents=documents[i:end],
                metadatas=metadatas[i:end]
            )
            
        print(f"✅ Sucesso! {total} documentos inseridos na coleção '{collection_name}'.")

    except Exception as e:
        print(f"❌ Erro ao migrar {filename}: {e}")

# --- MAPA DE MIGRAÇÃO ---
# De: Arquivo .pkl -> Para: Nome da Coleção
migrations = {
    "banco_aereo.pkl": "AEREO",
    "banco_fraude_pix.pkl": "FRAUDE_PIX",
    "banco_bloqueio_bancario.pkl": "BLOQUEIO_BANCARIO",
    "banco_corte_servico_essencial.pkl": "CORTE_ESSENCIAL",
    "banco_corte_luz.pkl": "LUZ", # Legacy
    "banco_nome_sujo.pkl": "NOME_SUJO",
    "banco_telefonia.pkl": "TELEFONIA",
    "banco_plano_saude.pkl": "PLANO_SAUDE",
    "banco_imobiliario.pkl": "IMOBILIARIO",
    "banco_seguradora.pkl": "SEGURADORA",
    "banco_redes_sociais.pkl": "REDES_SOCIAIS",
    "banco_ecommerce.pkl": "ECOMMERCE",
    "banco_ensino.pkl": "ENSINO"
}

print("🏁 Iniciando migração para ChromaDB...")
for pkl, col in migrations.items():
    migrate_pkl(pkl, col)

print("🎉 Migração concluída! Agora o ChromaDB está pronto.")
