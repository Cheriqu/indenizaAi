# ⚖️ IndenizaAi

**IndenizaAi** é uma plataforma de **LegalTech** que utiliza Inteligência Artificial e Jurimetria para democratizar o acesso à justiça. Analisamos relatos de problemas cotidianos (como voos cancelados, golpes digitais, negativação indevida, etc.) comparando-os com milhares de decisões reais dos tribunais brasileiros (TJPR) para estimar a probabilidade de ganho de causa e valores de indenização.

O projeto combina uma **Landing Page de Alta Conversão** com um **Backend Seguro e Escalável**, utilizando **RAG (Retrieval-Augmented Generation)** sobre uma base vetorial otimizada.

---

## 🚀 Funcionalidades

### 👤 Para o Cidadão (Cliente Final)
- **Diagnóstico Jurídico com IA**: Análise semântica do relato em segundos.
- **Relatório Completo**:
  - 🚦 **Probabilidade de Êxito**: Baseada em estatística real de casos similares.
  - 💰 **Estimativa de Valor**: Média das condenações recentes.
  - 📜 **Jurisprudência**: Exibição de sentenças análogas (Vencedoras e Perdedoras).
- **Privacidade**: Tratamento de dados conforme a LGPD e sistema de blur nos resultados antes do pagamento.
- **Fluxo de Pagamento**: Integração nativa com Mercado Pago para liberação do relatório PDF.

### 🛡️ Segurança e Arquitetura
- **RAG Vetorial (ChromaDB)**: Busca semântica de alta performance, carregando dados sob demanda para otimização de memória.
- **Proteção Avançada**:
  - **CORS Restrito**: Acesso limitado a domínios confiáveis.
  - **Input Validation**: Proteção contra payloads maliciosos e DoS.
  - **Logs Rotativos**: Monitoramento profissional de erros e acessos.
- **Cache Inteligente**: Sistema de TTL para evitar vazamento de memória em análises antigas.

---

## 📚 Categorias Atendidas

A IA do IndenizaAi é treinada em bases jurídicas específicas:

1. **✈️ Aéreo**: Atrasos, cancelamentos, extravio de bagagem.
2. **💳 Bancário**: Tarifas abusivas, juros indevidos.
3. **🚫 Nome Sujo**: Negativação indevida (SPC/Serasa).
4. **📱 Telefonia**: Cobranças indevidas, planos alterados.
5. **🤳 Fraude Digital**: Golpes do Pix, invasão de contas.
6. **🏥 Plano de Saúde**: Negativas de cobertura e reajustes.
7. **🛍️ E-commerce**: Atrasos e defeitos.
8. **💡 Serviços Essenciais**: Corte de luz/água.
9. **🏠 Imobiliário**: Atraso na entrega de chaves.
10. **🛡️ Seguradora**: Negativa de cobertura.
11. **🎓 Ensino**: Problemas com diplomas e cobranças.
12. **🌐 Redes Sociais**: Recuperação de contas hackeadas.
13. **💼 Trabalhista**: (Em breve)

---

## 🛠️ Stack Tecnológica

### Frontend (SPA)
- **Core**: React 18 + Vite + TypeScript.
- **Estilo**: Tailwind CSS + Componentes ShadCN-like.
- **Analytics**: Meta Pixel e Microsoft Clarity integrados.
- **Build**: Otimizado para produção.

### Backend (API REST)
- **Framework**: Python FastAPI (Async).
- **Banco de Dados**:
  - **Vetorial**: ChromaDB (Persistente e Otimizado).
  - **Relacional**: SQLite (Gestão de Leads).
- **IA & NLP**:
  - `Sentence Transformers` (Embeddings Multilíngues).
  - `Google Gemini Flash` (Classificação e Raciocínio).
  - `Cross-Encoder` (Reranking de precisão).
- **Infraestrutura**:
  - `uvicorn` (Servidor de Aplicação).
  - `logging` (Sistema de Logs Rotativos).
  - `cachetools` (Gestão de Memória).

---

## ⚙️ Instalação e Execução

### Pré-requisitos
- Node.js 18+ e Python 3.10+
- Chaves de API: Google Gemini, OpenRouter (Opcional), Mercado Pago.

### 1. Backend
```bash
cd backend
python3 -m venv venv
source venv/bin/activate

# Instalar dependências
pip install -r requirements.txt

# Migrar base vetorial (Primeira execução ou atualização de bases)
python migrate_to_chroma.py

# Configurar .env (Verificar .env.example) e definir SENHA_ADMIN
# Executar
uvicorn api:app --reload
```

### 2. Frontend
```bash
npm install
npm run build # Para produção
npm run dev   # Para desenvolvimento
```

---

## 🔐 Privacidade e Segurança

- **Aviso de Privacidade**: Página dedicada explicando coleta e uso de dados.
- **Segurança de Dados**: O sistema não armazena dados sensíveis desnecessários e utiliza canais criptografados.
- **Isenção de Responsabilidade**: Ferramenta informativa, não substitui advogado.

---

**IndenizaAi © 2026** - *Tecnologia a serviço da cidadania.*
