# ⚖️ Indeniza.ai - LegalTech com Inteligência Artificial

> **Nota:** Este projeto foi desenvolvido como um case de portfólio para demonstrar competências em Engenharia de Software, Arquitetura de Sistemas e Engenharia de IA.

---

## 🚀 Sobre o Projeto

O **Indeniza.ai** é uma plataforma SaaS (Software as a Service) focada em **Jurimetria e Acesso à Justiça**. A aplicação resolve um problema comum: a incerteza das pessoas sobre seus direitos em casos de danos morais e materiais (ex: voos cancelados, negativação indevida, problemas bancários).

Utilizando **GenAI (IA Generativa)** e **Busca Vetorial (RAG)**, o sistema analisa o relato do usuário em linguagem natural, compara com milhares de decisões reais dos tribunais e entrega um relatório instantâneo com a probabilidade de êxito e estimativa de valor da causa.

## 🧠 Arquitetura e Inteligência Artificial

O diferencial técnico do projeto reside na sua pipeline de dados e inferência:

1.  **Input Natural:** O usuário relata o caso (texto ou áudio).
2.  **Classificação & Estruturação (LLM):** Utilizamos **Google Gemini** para entender o contexto, extrair entidades e classificar a categoria jurídica.
3.  **Vector Search (RAG):** O relato é convertido em *embeddings* e comparado semanticamente com uma base de dados vetorial (**ChromaDB**) contendo jurisprudência real do TJPR.
4.  **Cálculo Jurimétrico:** Algoritmos proprietários cruzam os dados da IA com os precedentes encontrados para calcular a probabilidade de vitória.

## 🛠️ Stack Tecnológico

O projeto foi construído utilizando uma arquitetura moderna, escalável e segura.

### Frontend (SPA)
-   **Framework:** React + Vite
-   **Linguagem:** TypeScript
-   **Estilização:** Tailwind CSS (Responsividade e UI moderna)
-   **Analytics:** Integração avançada com Microsoft Clarity (Session Replay) e Google Analytics 4 (Eventos Personalizados).

### Backend (API REST)
-   **Framework:** FastAPI (Python) - Alta performance assíncrona.
-   **Banco de Dados Relacional:** PostgreSQL (Gerenciamento de Leads, Transações e Logs).
-   **Banco de Dados Vetorial:** ChromaDB (Armazenamento de Embeddings Jurídicos).
-   **Tasks Assíncronas:** Processamento de pagamentos e envios de e-mail em background.

### Infraestrutura & DevOps
-   **Servidor:** VPS Linux (Ubuntu).
-   **Servidor Web:** Nginx (Reverse Proxy e SSL).
-   **Gerenciamento de Processos:** Systemd.
-   **Monitoramento:** Painel "Mission Control" próprio para métricas de CPU/RAM e KPIs de negócio em tempo real.

## ✨ Funcionalidades Principais

-   **Análise Gratuita via IA:** Feedback imediato sobre a viabilidade do processo.
-   **Entrada de Voz:** Transcrição de áudio para texto integrada.
-   **Geração de PDF:** Criação dinâmica de relatórios detalhados com ReportLab.
-   **Checkout Transparente:** Integração completa com **Mercado Pago** (PIX/Cartão).
-   **Rastreamento de Marketing:** Sistema robusto de UTMs para atribuição de conversão por campanha/anúncio.
-   **Painel Administrativo:** Dashboard completo para gestão de leads e visualização de métricas do servidor.

## 📱 Status do Projeto

O projeto encontra-se em produção, processando leads reais e servindo como base para automação de triagem jurídica.

---

Desenvolvido por **Luiz Cherique**.
