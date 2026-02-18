# HEARTBEAT.md

# Verificações Periódicas (Intervalo sugerido: 30min)

1. **System Metrics (CRÍTICO):**
   - **EXECUTE** uma requisição GET para `http://localhost:8000/api/admin/metrics`.
   - **IMPORTANTE:** Isso força a coleta e armazenamento das métricas de CPU/RAM/Disco no banco de dados SQLite.
   - Sem essa chamada, o gráfico do Mission Control ficará vazio ou estático.
   - Não precisa relatar o JSON de resposta, apenas garanta que o comando `curl` rodou com sucesso (código 200).
