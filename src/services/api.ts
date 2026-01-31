
// URL da API
const API_URL = import.meta.env.PROD ? '/api' : 'http://localhost:8000/api';

export const api = {
    analyze: async (relato: string) => {
        const response = await fetch(`${API_URL}/analisar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ relato })
        });
        const data = await response.json();
        if (data.erro) throw new Error(data.erro);
        return data; // { id_analise, prob, valor, result... }
    },

    pagar: async (payload: any) => {
        const response = await fetch(`${API_URL}/pagar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        return await response.json();
    },

    getRelatorio: async (id: string) => {
        const response = await fetch(`${API_URL}/relatorio/${id}`);
        if (!response.ok) throw new Error("Erro ao buscar relatório");
        return await response.json();
    },

    getStatusPagamento: async (id: string) => {
        const response = await fetch(`${API_URL}/status_pagamento/${id}`);
        return await response.json();
    },

    downloadPdf: (id: string) => {
        window.open(`${API_URL}/download_pdf/${id}`, '_blank');
    },

    triggerApproval: async (id: string) => {
        await fetch(`${API_URL}/teste_aprovar/${id}`);
    }
};

export const loadCities = async () => {
    try {
        const r = await fetch('/municipios.txt');
        const text = await r.text();
        return text.split(',').map(c => c.trim()).sort();
    } catch (e) {
        console.error("Erro ao carregar cidades", e);
        return ['Curitiba'];
    }
};
