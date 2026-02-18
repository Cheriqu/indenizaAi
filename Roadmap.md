# 🗺️ Roadmap IndenizaAí - Q1 2026

**Status:** 🚀 Em Escala
**Versão:** 2.1.0

---

## 🎯 Objetivos da Semana (17/02 - 21/02)

O foco total esta semana é **Estabilidade e Observabilidade** para suportar o aumento de tráfego das campanhas de anúncios.

### 📊 Observabilidade & Dados (Prioridade Alta)
- [x] **Relatório Diário Automático:** Implementado envio de resumo via Telegram (Leads, Vendas, Acessos).
- [x] **Painel Mission Control:** Atualização visual e integração de métricas em tempo real.
- [x] **Rastreamento UTM:** Capturar origem do tráfego (Facebook/Google) para medir ROI por anúncio.
- [x] **Integração Clarity:** Refinar coleta de dados de comportamento do usuário.

### 🛡️ Infraestrutura & Segurança
- [x] **Cron Jobs (OpenClaw):** Migração de tarefas agendadas para o gerenciador interno.
- [x] **Manutenção de Memória:** Script automático para limpeza de logs antigos.
- [x] **Rate Limiting:** Proteção contra abuso de API (FastAPI Middleware, 100/dia/IP).
- [x] **Monitoramento de Erros:** Configurado Sentry para alertas em tempo real.

### 💻 Frontend & UX
- [x] **Correção de Fluxo:** "Nova Análise" funciona corretamente.
- [x] **Validação de Formulário:** Bloqueio de envio com campos vazios.
- [x] **Link de Recuperação:** Suporte a `?recover=UUID`.
- [x] **Entrada de Áudio (Voz):** Suporte a relatos por voz (transcrição via Google Gemini).

---

## ✅ Entregas Recentes (Concluído)

### 📈 Relatório de Funil & Rastreamento de Anúncios (Prioridade Alta - Anúncios Quarta-feira)
**Objetivo:** Monitorar ROI e conversão detalhada por criativo/copy para os anúncios que iniciam dia 18/02.
1.  **Rastreamento de Origem (UTMs):**
    -   [x] **Frontend:** Capturar `utm_source`, `utm_medium`, `utm_campaign`, `utm_content` da URL e persistir. Enviar junto com o cadastro do lead.
    -   [x] **Backend:** Adicionar colunas de UTM na tabela `leads` e salvar a origem de cada usuário.
2.  **Relatório de Funil Diário:**
    -   [x] **Integração Clarity:** Refinado rastreamento de erros e conversão com tags personalizadas e eventos de validação.
    -   [ ] **Agregação:** Criar rotina que compila: Sessões (Clarity) -> Leads (DB) -> Vendas (DB).
    -   [ ] **Conversão por Anúncio:** Detalhar Leads e Vendas agrupados por `utm_content` (identificador do anúncio/criativo) e `utm_campaign`.
    -   [ ] **Envio Automático:** Enviar este resumo diariamente (E-mail/Telegram) para o Luiz.

### 🏗️ Backend & Banco de Dados
- [x] **PostgreSQL:** Migração completa do SQLite para Postgres com Connection Pooling.
- [x] **Recuperação de Carrinho:** Robô automático envia e-mails para leads que não compraram.
- [x] **Webhook Mercado Pago:** Processamento assíncrono de pagamentos aprovados.


### 💻 Frontend & Experiência
- [x] **Nova Identidade Visual:** Interface limpa e responsiva.
- [x] **Fluxo de Análise:** Correção de bugs no formulário de "Nova Análise".
- [x] **PDF Generator:** Geração dinâmica de relatórios com jurisprudência real.

---

## 🔮 Futuro (Backlog)

### 🛍️ Produto & Conversão
- [ ] **Prova Social (FOMO):** Popup discreto mostrando "Maria acabou de recuperar R$ 5.000".
- [ ] **Entrada de Voz:** Permitir que o usuário dite o caso (Whisper AI).
- [ ] **Recuperação via WhatsApp:** Integração com API oficial para mensagens automáticas.

### 💰 B2B & Expansão
- [ ] **Painel de Advogados:** Venda de leads qualificados para parceiros jurídicos.
- [ ] **CRM Próprio:** Mini-CRM para advogados gerenciarem os leads comprados.

---

**Legenda:**
- [x] Feito
- [ ] Pendente
- **Negrito:** Destaque importante
