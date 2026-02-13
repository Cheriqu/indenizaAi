# 🗺️ Roadmap de Evolução - IndenizaAi (2026)

Status do Projeto: **Fase de Escala e Otimização**
Última Atualização: **13/02/2026**

---

## ✅ Concluído (Entregas Recentes)

### 🏗️ Infraestrutura Robusta
- [x] **Migração de Banco de Dados:** SQLite substituído por **PostgreSQL** para suportar alta concorrência.
- [x] **Webhooks Assíncronos:** Implementação de `BackgroundTasks` no FastAPI. O webhook do Mercado Pago responde instantaneamente (200 OK), evitando timeouts, enquanto o PDF é gerado em segundo plano.
- [x] **Segurança:** Remoção de credenciais hardcoded. Tudo agora via variáveis de ambiente (`.env`).

### ⚙️ Backend & Automação
- [x] **Recuperação de Carrinho (Cron):** Script automático (`recovery.py`) roda a cada hora buscando leads que não pagaram e envia link único de retomada.
- [x] **Admin API:** Novos endpoints para **reenvio de e-mail** e **aprovação manual** de pagamentos.
- [x] **Limpeza:** `requirements.txt` otimizado e `.env` padronizado.

### 💻 Frontend & UX
- [x] **Correção de Fluxo:** O botão "Nova Análise" agora força o reenvio dos dados de contato, corrigindo o bug de leads sem nome.
- [x] **Validação de Formulário:** Bloqueio de envio com campos vazios ou e-mails inválidos.
- [x] **Link de Recuperação:** O frontend reconhece `?recover=UUID` e carrega a análise antiga direto na tela de pagamento.

---

## 🚧 Em Progresso / Próximos Passos

### 1. Modernização da IA (Prioridade Técnica)
*   **Status:** 🟡 Pendente
*   **Tarefa:** Migrar da biblioteca depreciada `google.generativeai` para o novo SDK `google-genai`.
*   **Objetivo:** Garantir compatibilidade futura e usar "Structured Outputs" nativos para JSON mais estável.

### 2. Otimização de Conversão (Marketing)
*   **Status:** ⚪ Backlog
*   **Tarefa:** "Amostra Grátis" Visual.
*   **Objetivo:** Mostrar um "blur" menos agressivo ou parte do relatório para aumentar a confiança do usuário antes do pagamento.

---

## 📊 Métricas de Sistema
*   **Banco de Dados:** PostgreSQL (Tabela `leads` migrada e populada).
*   **Vetor Database:** ChromaDB (Persistente em disco).
*   **Cache:** TTLCache (Memória RAM para agilidade).
*   **Jobs:** Cron a cada 1h (`recovery.py`).
