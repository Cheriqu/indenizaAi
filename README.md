# ⚖️ IndenizaAi

**IndenizaAi** é uma plataforma inteligente que utiliza Inteligência Artificial e Jurimetria para democratizar o acesso à justiça. Analisamos relatos de problemas cotidianos (como voos cancelados, golpes digitais, negativação indevida, etc.) comparando-os com milhares de decisões reais dos tribunais brasileiros (TJPR) para estimar a probabilidade de ganho de causa e valores de indenização.

O projeto combina uma **Landing Page de Alta Conversão** (React + Tailwind) com um **Backend Poderoso** (Python/FastAPI) e um sistema de **RAG (Retrieval-Augmented Generation)** com bases vetoriais segregadas por especialidade.

---

## 🚀 Funcionalidades

### 👤 Para o Cidadão (Cliente Final)
- **Diagnóstico Jurídico com IA**: Análise semântica do relato em 30 segundos.
- **Relatório Completo**:
  - 🚦 **Probabilidade de Êxito**: Baseada em estatística real de casos similares.
  - 💰 **Estimativa de Valor**: Média das condenações recentes.
  - 📜 **Jurisprudência**: Exibição de sentenças análogas (Vencedoras e Perdedoras).
- **Segurança de Dados**: Blur nos resultados até a confirmação do salvamento do contato.
- **Transparência**: Páginas dedicadas de "Sobre Nós", "Política de Reembolso" e LGPD.
- **Fluxo de Pagamento**: Integração nativa com Mercado Pago (Desbloqueio de Relatório PDF).

### 💼 Para o Administrador (Painel Gerencial)
- **CRM Integrado**: Gestão completa de leads capturados.
- **Visão 360º**:
  - Status dos pagamentos em tempo real.
  - Conversão de Vendas (Leads vs Pagantes).
  - Potencial financeiro total das causas analisadas.
- **Ferramentas de Operação**:
  - Aprovação manual de pagamentos.
  - Reenvio de relatórios PDF por e-mail.
  - Exportação de dados (CSV) para campanhas de marketing.

---

## 📚 Categorias Atendidas (Bases de Conhecimento)

A IA do IndenizaAi é treinada em bases jurídicas específicas para garantir alta precisão:

1. **✈️ Aéreo**: Atrasos, cancelamentos, extravio de bagagem.
2. **💳 Bancário**: Tarifas abusivas, juros indevidos, cartão não solicitado.
3. **🚫 Nome Sujo**: Negativação indevida (SPC/Serasa), manutenção de cadastro.
4. **📱 Telefonia**: Cobranças indevidas, alteração unilateral de plano.
5. **🤳 Fraude Digital**: Golpes do Pix, invasão de conta, engenharia social.
6. **🏥 Plano de Saúde**: Negativa de cirurgia, home care, medicamentos, reajuste.
7. **🛍️ E-commerce**: Produto não entregue, defeito, atraso excessivo.
8. **💡 Serviços Essenciais**: Corte indevido de luz/água, cobrança por estimativa (TOI).
9. **🏠 Imobiliário**: Atraso na entrega de chaves, vícios construtivos.
10. **🛡️ Seguradora**: Negativa de cobertura (Auto/Residencial/Vida).
11. **🎓 Ensino**: Problemas com diploma, cobrança após trancamento.
12. **🌐 Redes Sociais**: Contas hackeadas, recuperação de perfil.

*(Caso não se encaixe, a categoria "Outros" é acionada)*

---

## 🛠️ Stack Tecnológica

### Frontend (SPA)
- **Core**: React 18 + Vite + TypeScript.
- **Estilo**: Tailwind CSS 4 + ShadCN/UI concepts + Lucide Icons.
- **Rotas**: React Router Dom (Home, Sobre, Admin).
- **Animações**: Framer Motion + CSS Animations (Waves, Fade-ins).
- **Build**: Otimizado para produção com lazy loading.

### Backend (API REST)
- **Runtime**: Python 3.10+.
- **Framework**: FastAPI (Async e High Performance).
- **Banco de Dados**: SQLite (Relacional) + Pickle/Chroma (Vetorial).
- **IA & NLP**:
  - `Sentence Transformers` (Embeddings Multilíngues).
  - `Google Gemini Flash` (Raciocínio e Classificação).
  - `scikit-learn` (Cálculo de Similaridade de Cosseno).
- **Utilitários**: ReportLab (PDF Engine), SMTP (E-mail Sender).

---

## ⚙️ Instalação e Execução

### Pré-requisitos
- Node.js 18+ e Python 3.10+
- Chaves de API: Google Gemini, OpenAI/OpenRouter (Opcional), Mercado Pago.

### 1. Backend
```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Configure o .env com suas chaves
cp .env.example .env

# Execute
uvicorn api:app --reload
```

### 2. Frontend
```bash
npm install
npm run dev
```

O sistema estará acessível em: `http://localhost:5173`.

---

## 🔐 Privacidade e Segurança (LGPD)

O projeto foi desenhado com foco em *"Privacy by Design"*:
- **Aviso de Privacidade**: Página dedicada explicando coleta e uso de dados.
- **Transparência**: O usuário consente explicitamente antes de qualquer envio de contato.
- **Retenção Mínima**: Dados sensíveis são armazenados apenas para a finalidade do serviço e podem ser excluídos mediante solicitação.
- **Isenção de Responsabilidade**: O sistema deixa claro que **não substitui um advogado** e fornece apenas informações estatísticas.

---

**IndenizaAi © 2026** - *Tecnologia a serviço da cidadania.*