# 🗺️ Roadmap de Evolução - IndenizaAi (2026)

Status do Projeto: **Fase de Escala e Otimização**
Última Atualização: **14/02/2026**

---

## ✅ Concluído (Entregas Recentes)

### 🏗️ Infraestrutura Robusta
- [x] **Connection Pooling (PostgreSQL):** Implementado `psycopg2.pool` para gerenciar conexões com o banco, prevenindo quedas por excesso de clientes simultâneos.
- [x] **Tratamento de Erros:** Correção crítica no `finally` dos endpoints para evitar erros mascarados quando o banco está indisponível.
- [x] **Migração de Banco de Dados:** SQLite substituído por **PostgreSQL**.
- [x] **Webhooks Assíncronos:** Implementação de `BackgroundTasks` no FastAPI.
- [x] **Modernização da IA (Google GenAI):** Migração completa para o novo SDK.

### ⚙️ Backend & Automação
- [x] **Recuperação de Carrinho (Cron):** Script automático (`recovery.py`) roda a cada hora.
- [x] **Admin API:** Novos endpoints para **reenvio de e-mail** e **aprovação manual**.

### 💻 Frontend & UX
- [x] **Correção de Fluxo:** "Nova Análise" funciona corretamente.
- [x] **Validação de Formulário:** Bloqueio de envio com campos vazios.
- [x] **Link de Recuperação:** Suporte a `?recover=UUID`.

---

## 🚧 Próximo Sprint (Foco em Produto e B2B)

### 📈 Relatório de Funil & Rastreamento de Anúncios (Prioridade Alta - Anúncios Quarta-feira)
**Objetivo:** Monitorar ROI e conversão detalhada por criativo/copy para os anúncios que iniciam dia 18/02.
1.  **Rastreamento de Origem (UTMs):**
    -   [ ] **Frontend:** Capturar `utm_source`, `utm_medium`, `utm_campaign`, `utm_content` da URL e persistir. Enviar junto com o cadastro do lead.
    -   [ ] **Backend:** Adicionar colunas de UTM na tabela `leads` e salvar a origem de cada usuário.
2.  **Relatório de Funil Diário:**
    -   [ ] **Integração Clarity:** Obter número de sessões diárias via API do Microsoft Clarity (ou Data Export).
    -   [ ] **Agregação:** Criar rotina que compila: Sessões (Clarity) -> Leads (DB) -> Vendas (DB).
    -   [ ] **Conversão por Anúncio:** Detalhar Leads e Vendas agrupados por `utm_content` (identificador do anúncio/criativo) e `utm_campaign`.
    -   [ ] **Envio Automático:** Enviar este resumo diariamente (E-mail/Telegram) para o Luiz.

### 🛡️ Blindagem & Performance (Pré-Tráfego)
**Objetivo:** Garantir estabilidade e velocidade para campanhas pagas.
3.  **Rate Limiting:**
    -   [ ] **Nginx/FastAPI:** Configurar limites de requisição por IP para evitar abuso de créditos de IA e DoS.
4.  **Monitoramento de Erros (Sentry):**
    -   [ ] **Setup:** Instalar SDK do Sentry no Backend para alertas de erros 500 em tempo real.
5.  **Otimização de Performance (UX):**
    -   [ ] **Frontend:** Auditar tamanho do bundle React e configurar cache de assets estáticos no Nginx.
    -   [ ] **Database:** Criar índices nas colunas de filtro (data_criacao, status, utms) para relatórios rápidos.

### 🛍️ Produto & Experiência (UX)
6.  **Prova Social (FOMO):** Popup discreto notificando recuperações recentes.
2.  **Amostra Grátis Visual:** Mostrar parte do relatório sem blur.
3.  **Entrada de Áudio:** Permitir relato por voz (Whisper AI).
4.  **Recuperação via WhatsApp:** Integração para enviar lembretes.

### 💰 Negócios (B2B)
5.  **Venda do Lead (Painel de Advogados):** Encaminhar leads qualificados para parceiros.

### 🏗️ Infraestrutura
6.  **Containerização (Docker):** Criar `Dockerfile`.
7.  **Observabilidade (Sentry):** Monitoramento de erros.
8.  **Testes Automatizados:** Testes unitários de backend.

---

## 📊 Métricas de Sistema
*   **Banco de Dados:** PostgreSQL (Tabela `leads` migrada e populada).
*   **Vetor Database:** ChromaDB (Persistente em disco).
*   **Cache:** TTLCache (Memória RAM para agilidade).
*   **Jobs:** Cron a cada 1h (`recovery.py`).
