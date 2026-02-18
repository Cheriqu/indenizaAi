import axios from 'axios';

// URL da API
// Em produção, o Nginx serve o frontend e faz proxy de /api para o backend na porta 8000
// Em dev, o Vite faz proxy ou usamos localhost:8000 direto
const BASE_URL = import.meta.env.PROD ? '/api' : 'http://localhost:8000/api';

// Instância do Axios
const axiosInstance = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Mantemos a compatibilidade com o objeto `api` antigo, mas agora ele usa o axiosInstance internamente
// E também expomos o próprio axiosInstance como padrão para chamadas genéricas (.get, .post)
export const api = {
    // Métodos Genéricos (para MissionControl e outros componentes novos)
    get: (url: string, config?: any) => axiosInstance.get(url, config),
    post: (url: string, data?: any, config?: any) => axiosInstance.post(url, data, config),
    put: (url: string, data?: any, config?: any) => axiosInstance.put(url, data, config),
    delete: (url: string, config?: any) => axiosInstance.delete(url, config),

    // Métodos Específicos do Domínio (Mantidos para compatibilidade)
    analyze: async (relato: string) => {
        try {
            const { data } = await axiosInstance.post('/analisar', { relato });
            if (data.erro) throw new Error(data.erro);
            return data;
        } catch (error: any) {
            throw new Error(error.response?.data?.detail || error.message);
        }
    },

    pagar: async (payload: any) => {
        const { data } = await axiosInstance.post('/pagar', payload);
        return data;
    },

    saveLead: async (payload: any) => {
        try {
            const { data } = await axiosInstance.post('/salvar_lead', payload);
            return data;
        } catch (error: any) {
            console.error("Erro salvar lead:", error);
            throw new Error(error.response?.data?.detail || "Erro ao salvar contato");
        }
    },

    transcrever: async (file: File) => {
        const formData = new FormData();
        formData.append("file", file);
        
        const response = await fetch(`${API_URL}/transcrever`, {
            method: 'POST',
            body: formData, // fetch sets content-type automatically for FormData
        });
        
        if (!response.ok) {
            throw new Error("Erro na transcrição");
        }
        return await response.json();
    },

    getRelatorio: async (id: string) => {
        const { data } = await axiosInstance.get(`/relatorio/${id}`);
        return data;
    },

    getStatusPagamento: async (id: string) => {
        const { data } = await axiosInstance.get(`/status_pagamento/${id}`);
        return data;
    },

    downloadPdf: (id: string) => {
        window.open(`${BASE_URL}/download_pdf/${id}`, '_blank');
    },

    triggerApproval: async (id: string) => {
        await axiosInstance.get(`/teste_aprovar/${id}`);
    },
};

export default axiosInstance;

// Helpers de IBGE (mantidos iguais)
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
