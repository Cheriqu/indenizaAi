# MEMORY.md - Long Term Memory

Este arquivo contém memórias curadas, decisões importantes e contexto de longo prazo.

## Projetos
- **IndenizaAi:** Projeto principal (LegalTech). Stack: Python (FastAPI), React (Vite), PostgreSQL (Migrado de SQLite), ChromaDB.
- **Frontend Build:** Sempre que houver alterações no frontend (`src/`), deve-se executar `npm run build` na pasta `/var/www/indeniza`.

## Preferências do Usuário
- **Comunicação:** Direta, sem floreios ("No performative helpfulness").
- **Segurança:** Stop-Look-Ask para comandos destrutivos.
- **Memória:** Exige persistência via arquivos diários em `memory/`.

## Infraestrutura
- VPS Contabo (6 vCPU, 12GB RAM).
- Acesso ROOT (cuidado extremo).
- **GPU:** Sem GPU dedicada (não tentar diagnósticos de nvidia-smi).
- **Segurança:** Firewall UFW instalado e ativo.

## Ferramentas & Paradigmas (2026-02-16)
- **Busca em Memória (QMD):** Implementado sistema de busca híbrida (BM25 + Vetorial) para arquivos locais.
  - *Uso:* Preferir `qmd search` (rápido) ou `qmd vsearch` (semântico) via terminal para encontrar informações em notas e logs passados.
  - *Manutenção:* Cron job configurado para atualização horária do índice.
- **Pesquisa Web Avançada (Exa AI):** Skill `exa-search` instalada e configurada com API Key.
  - *Uso:* Utilizar para pesquisas profundas, busca de código ou crawling de conteúdo técnico onde o Google Search é insuficiente.
  - *Comandos:* `node skills/exa-search/scripts/exa_search.mjs [search|neural|crawl] "query"`.

## Sessão Atual (2026-02-17)
- **Diagnóstico de Sistema:** Confirmado ausência de GPU dedicada e presença de Firewall UFW ativo.
- **Instalação de Skills:**
  - `levineam/qmd-skill`: Instalado manualmente, compilado `llama.cpp` localmente e indexado o workspace.
  - `exa-search`: Criada skill customizada com script Node.js e integração via `.env`. Teste de busca "neural" realizado com sucesso.
- **Limites de Recursos:** Definidos rate limits estritos no `AGENTS.md` (10s entre APIs, 20s entre buscas web, orçamento de 30M tokens).
- **Frontend IndenizaAi:**
  - Ajustes de layout: Alinhamento vertical do contador de caracteres.
  - Ajustes de texto: "chars" -> "caracteres", "Tribunais de todo Brasil".
  - **Procedimento:** Build automático (`npm run build`) após alterações no frontend.
