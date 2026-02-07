# Como Adicionar Novos Bancos de Assuntos (Pickle -> ChromaDB)

Este guia descreve o processo para adicionar uma nova categoria jurídica ao sistema RAG do IndenizaAi.

## Pré-requisitos

1.  Um novo arquivo `.pkl` contendo o DataFrame e os Vetores (gerado pelo notebook de treinamento).
    *   O arquivo deve conter um dicionário: `{"dataframe": df, "vetores": numpy_array}`.
    *   O DataFrame deve ter as colunas: `resumo`, `texto_para_embedding`, `data_julgamento`, `resultado`, `valor_dano_moral`, `valor_dano_material` (ou `valor_total`).

## Passo a Passo

### 1. Upload do Arquivo

Coloque o novo arquivo `.pkl` na pasta: `/var/www/indeniza/backend/`.
Exemplo: `banco_direito_trabalhista.pkl`.

### 2. Atualizar Script de Migração

Edite o arquivo `/var/www/indeniza/backend/migrate_to_chroma.py`.

Adicione uma nova entrada no dicionário `migrations` no final do arquivo:

```python
migrations = {
    # ... existentes ...
    "banco_direito_trabalhista.pkl": "TRABALHISTA" 
}
```

*   A chave é o nome do arquivo.
*   O valor é o NOME DA COLEÇÃO no ChromaDB (use letras maiúsculas, sem espaços).

### 3. Executar Migração

Rode o script para inserir os dados no ChromaDB:

```bash
cd /var/www/indeniza/backend
../venv/bin/python migrate_to_chroma.py
```

Aguarde a mensagem de sucesso: `✅ Sucesso! X documentos inseridos na coleção 'TRABALHISTA'`.

### 4. Atualizar o "Porteiro" (API)

Agora você precisa ensinar a IA a reconhecer esse novo assunto.

Edite o arquivo `/var/www/indeniza/backend/api.py`.

Localize a função `analisar_caso` e o texto do `prompt_text`.
Adicione a nova categoria na lista numerada:

```python
prompt_text = """
Analise o seguinte relato...
...
12. ENSINO (...)
13. TRABALHISTA (Demissão sem justa causa, hora extra, assédio moral) <--- ADICIONE AQUI
14. OUTROS (...)
"""
```

⚠️ **Importante:** O nome da categoria no prompt (ex: `TRABALHISTA`) deve ser **IDÊNTICO** ao nome da coleção que você definiu no passo 2.

### 5. Reiniciar a API

Para que a alteração no prompt entre em vigor, reinicie o serviço:

```bash
systemctl restart indeniza-api.service
```

## Resumo

1.  `cp novo.pkl backend/`
2.  Edit `migrate_to_chroma.py` -> Add to dict.
3.  Run `python migrate_to_chroma.py`.
4.  Edit `api.py` -> Add to Prompt.
5.  `systemctl restart indeniza-api.service`.
