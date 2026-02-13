# ⚖️ IndenizaAi - Plataforma de Jurimetria Automatizada

O **IndenizaAi** é uma LegalTech que utiliza Inteligência Artificial para analisar casos cotidianos (voo cancelado, nome negativado, etc.) e estimar a probabilidade de êxito e valor de indenização com base na jurisprudência do TJPR.

---

## 🛠️ Stack Tecnológica

### Backend (`/backend`)
*   **Linguagem:** Python 3.12+
*   **Framework:** FastAPI (High Performance)
*   **Banco de Dados:** PostgreSQL (Dados relacionais)
*   **Vector DB:** ChromaDB (Busca semântica de jurisprudência)
*   **AI:** Google Gemini (Análise de contexto e classificação)
*   **Tasks:** BackgroundTasks (Async) + Cron Jobs (Recuperação)
*   **Libs Principais:** `psycopg2`, `sentence-transformers`, `uvicorn`, `mercadopago`.

### Frontend (`/src`)
*   **Framework:** React 18 + Vite
*   **Estilização:** TailwindCSS
*   **Deploy:** Build estático servido por Nginx/Apache.

---

## 🚀 Instalação e Configuração

### 1. Pré-requisitos
*   Python 3.12+
*   Node.js 20+
*   PostgreSQL 14+

### 2. Backend Setup

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Configurar Variáveis de Ambiente
cp .env.example .env
# Edite o .env com as credenciais do PostgreSQL, Brevo, Google AI e Mercado Pago.
```

### 3. Banco de Dados
```bash
# Crie o banco e usuário no Postgres
sudo -u postgres psql -c "CREATE USER indeniza WITH PASSWORD 'sua_senha';"
sudo -u postgres psql -c "CREATE DATABASE indeniza_db OWNER indeniza;"

# A tabela 'leads' será criada automaticamente ao iniciar a API.
```

### 4. Executando
```bash
# Backend (Porta 8000)
cd backend
./venv/bin/uvicorn api:app --host 0.0.0.0 --port 8000

# Frontend (Porta 5173 ou Build)
cd ..
npm install
npm run dev # ou npm run build
```

---

## ⚙️ Funcionalidades Críticas

### 💳 Webhook de Pagamento
O endpoint `/api/webhook` processa pagamentos do Mercado Pago de forma **assíncrona**.
1.  Recebe notificação `payment.created`.
2.  Responde `200 OK` imediatamente.
3.  Em background: Valida pagamento -> Gera PDF -> Envia E-mail (Brevo).

### 🔄 Recuperação de Carrinho
Um script (`backend/recovery.py`) roda via **Cron** a cada 1 hora.
*   Busca leads criados há >1h que não pagaram.
*   Envia e-mail único com link de recuperação (`?recover=UUID`).
*   O frontend restaura a sessão e permite pagamento direto.

### 🛡️ Admin
Painel administrativo para:
*   Visualizar KPIs (Conversão, Faturamento).
*   Exportar CSV de leads.
*   Reenviar e-mails de clientes manualmente.
*   Aprovar pagamentos manualmente.

---

## 📂 Estrutura de Pastas
*   `backend/`: Código Python, API, Scripts.
    *   `api.py`: Aplicação principal.
    *   `recovery.py`: Script de automação.
    *   `chroma_db/`: Banco vetorial (persistente).
*   `src/`: Código React.
    *   `app/App.tsx`: Lógica principal do frontend.
*   `dist/`: Build de produção do frontend.

---

**© 2026 IndenizaAi** - Desenvolvido por Claw.
