# HEARTBEAT.md

# Verificações Periódicas (Intervalo sugerido: 30min)

1. **System Metrics:**
   - Faça uma requisição GET para `http://localhost:8000/api/admin/metrics` para forçar a coleta de métricas do sistema (CPU/RAM/Disco) e popular o gráfico do Mission Control.
   - Não precisa relatar o resultado, apenas "pingar" para garantir o registro no banco.
