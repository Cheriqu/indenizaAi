---
name: exa-search
description: Powerful neural search and research engine by Exa.ai.
---

# Exa Search Skill

Use this skill when you need deep research capabilities beyond standard web search. Exa excels at finding specific technical content, code snippets, academic papers, and "hard to find" information using neural search.

## Tools

### exa_search

Perform a keyword or neural search using Exa.

**Usage:**
```bash
node skills/exa-search/scripts/exa_search.mjs search "your query here"
```

**Options:**
- `--neural`: Use neural/semantic search instead of keyword (better for complex queries).
- `--num <number>`: Number of results (default 5).

### exa_crawl

Retrieve the full content of a specific URL or perform a targeted crawl.

**Usage:**
```bash
node skills/exa-search/scripts/exa_search.mjs crawl "https://example.com/article"
```

### exa_similar

Find pages similar to a given URL. Great for expanding research from a single good source.

**Usage:**
```bash
node skills/exa-search/scripts/exa_search.mjs find-similar "https://good-source.com"
```

## Setup

1. Get an API Key from [Exa.ai](https://exa.ai).
2. Add `EXA_API_KEY=your_key` to your `.env` file in the workspace root.
