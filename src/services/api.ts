
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

    saveLead: async (payload: any) => {
        const response = await fetch(`${API_URL}/salvar_lead`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!response.ok) {
            const err = await response.json();
            console.error("Erro salvar lead:", err);
            throw new Error(err.detail || "Erro ao salvar contato");
        }
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

export const loadStates = async () => {
    try {
        const response = await fetch("https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome");
        const data = await response.json();
        return data.map((uf: any) => ({ sigla: uf.sigla, nome: uf.nome }));
    } catch (error) {
        console.error("Erro ao buscar estados", error);
        return [];
    }
};

export const loadCitiesByState = async (uf: string) => {
    try {
        const response = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios`);
        const data = await response.json();
        return data.map((city: any) => city.nome);
    } catch (error) {
        console.error("Erro ao buscar cidades", error);
        return [];
    }
};
