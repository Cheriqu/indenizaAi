# ⚖️ IndenizaAi

**IndenizaAi** é uma plataforma inteligente que utiliza Inteligência Artificial para analisar casos de danos morais e materiais (como aviação, bancário, telefonia e mais), estimando a probabilidade de êxito e o valor da indenização com base em jurisprudência real do Tribunal de Justiça do Paraná (TJPR).

O projeto combina uma **Landing Page de Alta Conversão** (React + Tailwind) com um **Backend Poderoso** (Python/FastAPI + IA) e um **Painel Administrativo** para gestão de leads.

---

## 🚀 Funcionalidades

### 👤 Para o Usuário (Cliente Final)
- **Análise com IA em 30 segundos**: O usuário relata o problema e a IA consulta bases de dados reais.
- **Relatório Jurimétrico**: Probabilidade de êxito (Gauge Chart) e estimativa de valor.
- **Fluxo de Pagamento Integrado**: Integração com Mercado Pago para desbloquear o relatório completo.
- **Geração de PDF**: Download automático de um relatório detalhado em PDF após o pagamento.
- **Responsivo e Animado**: Interface moderna, mobile-first, com animações suaves e prova social em tempo real.

### 💼 Para o Administrador (Painel Gerencial)
- **Dashboard de Métricas**:
  - Total de Leads vs. Vendas (Taxa de Conversão).
  - Faturamento Estimado (R$ 9,90 por relatório desbloqueado).
  - Potencial Jurídico (Soma das causas analisadas).
- **Lista de Leads**: Acompanhamento detalhado de cada análise (Nome, WhatsApp, Resumo, Probabilidade).
- **Ações Rápidas**:
  - ✅ Aprovação Manual de pagamento.
  - 📧 Reenvio de Relatório por E-mail.
- **Exportação**: Download da base de leads em CSV.

---

## 🛠️ Tecnologias Utilizadas

### Frontend
- **React 18** (Vite)
- **Tailwind CSS** (Estilização e Design System)
- **Lucide React** (Ícones)
- **Framer Motion** (Animações - opcional)
- **React Router Dom** (Navegação)

### Backend
- **Python 3.10+**
- **FastAPI** (API REST de alta performance)
- **SQLite** (Banco de dados leve e eficiente)
- **Sentence Transformers** (IA para busca semântica de jurisprudência)
- **OpenAI / OpenRouter API** (LLMs para classificação de casos: Llama, Gemini, etc.)
- **ReportLab** (Geração de PDFs dinâmicos)
- **Mercado Pago SDK** (Processamento de pagamentos)

---

## 📂 Estrutura do Projeto

```
indenizaAi/
├── backend/                # Código do Servidor Python
│   ├── api.py             # Aplicação Principal FastAPI
│   ├── indeniza.db        # Banco de Dados SQLite
│   └── *.pkl              # Bases de Jurisprudência Vetorizadas
├── public/                 # Arquivos Estáticos Públicos
├── src/                    # Código Fonte Frontend
│   ├── app/
│   │   ├── components/    # Componentes React (Admin, Gauge, etc.)
│   │   └── App.tsx        # Página Principal (Home)
│   ├── services/          # Integração API (api.ts)
│   ├── styles/            # CSS Modules e Tailwind
│   └── main.tsx           # Ponto de Entrada / Rotas
├── index.html              # Entry HTML
├── package.json            # Dependências Frontend
└── vite.config.ts          # Configuração Vite
```

---

## ⚙️ Como Rodar Localmente

### 1. Backend (API)
```bash
# Entre na pasta do projeto
cd backend

# Crie e ative o ambiente virtual
python3 -m venv venv
source venv/bin/activate

# Instale as dependências
pip install -r requirements.txt

# Rode o servidor
uvicorn api:app --reload --host 0.0.0.0 --port 8000
```

### 2. Frontend (Interface)
```bash
# Na raiz do projeto
npm install
npm run dev
```
Acesse: `http://localhost:5173`

---

## 🔐 Acesso Administrativo

Para acessar o painel de controle e ver os leads capturados:
1. Acesse: `https://indenizaapp.com.br/admin` (ou `/admin` localmente)
2. Senha Padrão: `admin123` (Configurável no `.env`)

---

## 🤖 Inteligência Artificial

O sistema utiliza um sistema híbrido de RAG (Retrieval-Augmented Generation):
1. **Embedding**: O relato do usuário é convertido em vetor matemático.
2. **Busca Semântica**: Comparamos esse vetor com milhares de decisões reais do TJPR pré-processadas.
3. **Classificação (LLM)**: Usamos modelos Llama/Gemini para entender a categoria (Aéreo, Bancário, etc.) e validar o relato.
4. **Cálculo Probabilístico**: Baseado no histórico de "Vitória" vs "Derrota" dos casos similares encontrados.

---

**Desenvolvido por IndenizaAi © 2026**