import { useState, useMemo } from 'react'
import { Filter, DollarSign, Users, CheckCircle, Search, FileSpreadsheet, Send, CheckSquare } from 'lucide-react'

const API_URL = import.meta.env.PROD ? 'https://indenizaapp.com.br/api' : 'http://localhost:8000/api';

export default function Admin() {
    const [senha, setSenha] = useState('')
    const [leads, setLeads] = useState<any[]>([])
    const [logado, setLogado] = useState(false)
    const [loading, setLoading] = useState(false)
    const [filtroPagos, setFiltroPagos] = useState(false)

    const buscarLeads = async () => {
        setLoading(true)
        try {
            const res = await fetch(`${API_URL}/admin/leads`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ senha })
            })
            if (res.status === 401) {
                alert("Senha errada!")
                setLoading(false)
                return
            }
            const data = await res.json()
            setLeads(data)
            setLogado(true)
        } catch (e) { alert("Erro ao conectar") }
        setLoading(false)
    }

    const leadsFiltrados = useMemo(() => {
        if (filtroPagos) return leads.filter(l => l.pagou === 1 || l.pagou === true)
        return leads
    }, [leads, filtroPagos])

    const kpis = useMemo(() => {
        const total = leads.length
        const pagos = leads.filter(l => l.pagou === 1 || l.pagou === true).length
        const conversao = total > 0 ? ((pagos / total) * 100).toFixed(1) : 0
        const faturamento = pagos * 9.90 // Preço fixo R$ 9,90
        const potencial = leads.reduce((acc, l) => acc + (parseFloat(l.valor_estimado) || 0), 0)

        return { total, pagos, conversao, faturamento, potencial }
    }, [leads])

    const formatMoney = (val: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)
    }

    const handleExport = async () => {
        if (!confirm("Baixar Planilha de Leads?")) return
        try {
            const res = await fetch(`${API_URL}/admin/exportar_csv`, {
                method: 'POST', body: JSON.stringify({ senha }), headers: { 'Content-Type': 'application/json' }
            })
            if (!res.ok) return alert("Erro ao baixar")
            const blob = await res.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = "Leads_IndenizaAi.csv"
            a.click()
        } catch (e) { alert("Erro exportação") }
    }

    const handleAction = async (tipo: 'reenviar_email' | 'aprovar_manual', id: string) => {
        if (!confirm(tipo === 'reenviar_email' ? "Reenviar Email?" : "Aprovar Manualmente?")) return
        try {
            const res = await fetch(`${API_URL}/admin/${tipo}`, {
                method: 'POST', body: JSON.stringify({ senha, id_analise: id }), headers: { 'Content-Type': 'application/json' }
            })
            const d = await res.json()
            alert(d.mensagem || d.status)
            if (res.ok) buscarLeads()
        } catch (e) { alert("Erro ação") }
    }

    if (!logado) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100">
                <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-sm">
                    <h1 className="text-2xl font-bold mb-6 text-[#1c80b2] text-center">Admin Indeniza</h1>
                    <div className="flex flex-col gap-4">
                        <input
                            type="password"
                            placeholder="Senha de Acesso"
                            className="p-3 border rounded border-gray-300 focus:outline-none focus:border-[#1c80b2]"
                            value={senha}
                            onChange={e => setSenha(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && buscarLeads()}
                        />
                        <button
                            onClick={buscarLeads}
                            disabled={loading}
                            className="bg-[#1c80b2] hover:bg-[#156a94] text-white font-bold p-3 rounded transition-colors disabled:opacity-50"
                        >
                            {loading ? 'Entrando...' : 'Acessar Painel'}
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="p-4 md:p-8 bg-gray-50 min-h-screen font-sans">
            <header className="mb-8 flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-[#1c80b2]">Dashboard Gerencial</h1>
                    <p className="text-gray-500">Acompanhamento de Leads e Vendas em Tempo Real</p>
                </div>
                <div className="flex gap-4 items-center">
                    <button onClick={handleExport} className="flex gap-2 items-center bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition">
                        <FileSpreadsheet size={18} /> Exportar CSV
                    </button>
                    <button onClick={() => window.location.reload()} className="text-sm text-gray-400 hover:text-[#1c80b2] underline">Sair</button>
                </div>
            </header>

            {/* KPIS */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-blue-500">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-gray-500 font-medium">Total de Leads</h3>
                        <Users size={20} className="text-blue-500" />
                    </div>
                    <p className="text-3xl font-bold text-gray-800">{kpis.total}</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-green-500">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-gray-500 font-medium">Vendas Realizadas</h3>
                        <CheckCircle size={20} className="text-green-500" />
                    </div>
                    <p className="text-3xl font-bold text-gray-800">{kpis.pagos}</p>
                    <p className="text-xs text-green-600 font-bold mt-1">Conv. {kpis.conversao}%</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-emerald-600">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-gray-500 font-medium">Faturamento Estimado</h3>
                        <DollarSign size={20} className="text-emerald-600" />
                    </div>
                    <p className="text-3xl font-bold text-gray-800">{formatMoney(kpis.faturamento)}</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-purple-500">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-gray-500 font-medium">Potencial Jurídico</h3>
                        <DollarSign size={20} className="text-purple-500" />
                    </div>
                    <p className="text-2xl font-bold text-gray-800">{formatMoney(kpis.potencial)}</p>
                    <p className="text-xs text-gray-400">Soma das indenizações estimadas</p>
                </div>
            </div>

            {/* CONTROLES */}
            <div className="flex justify-between items-center mb-4 bg-white p-4 rounded-lg shadow-sm">
                <div className="flex items-center gap-2">
                    <Filter size={18} className="text-gray-500" />
                    <span className="font-semibold text-gray-700">Filtros:</span>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setFiltroPagos(false)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${!filtroPagos ? 'bg-[#1c80b2] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    >
                        Todos
                    </button>
                    <button
                        onClick={() => setFiltroPagos(true)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${filtroPagos ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    >
                        Apenas Pagos
                    </button>
                </div>
            </div>

            {/* TABELA */}
            <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-gray-100">
                <table className="min-w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-700 font-bold uppercase border-b">
                        <tr>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Data</th>
                            <th className="px-6 py-4">Cliente</th>
                            <th className="px-6 py-4">Contatos</th>
                            <th className="px-6 py-4">Categoria / Resumo</th>
                            <th className="px-6 py-4 text-right">Estimativa</th>
                            <th className="px-6 py-4 text-center">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {leadsFiltrados.map((lead) => {
                            const pagou = lead.pagou === 1 || lead.pagou === true
                            return (
                                <tr key={lead.id} className="hover:bg-blue-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${pagou ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                            {pagou ? 'PAGO' : 'PENDENTE'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-500 whitespace-nowrap">
                                        {new Date(lead.data_registro + "Z").toLocaleDateString('pt-BR')} <br />
                                        <span className="text-xs">{new Date(lead.data_registro + "Z").toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-gray-900">{lead.nome}</div>
                                        <div className="text-xs text-gray-500">{lead.cidade}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded w-fit">{lead.email}</span>
                                            <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded w-fit">{lead.whatsapp}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 max-w-xs">
                                        <span className="font-bold text-[#1c80b2] text-xs uppercase tracking-wider">{lead.categoria}</span>
                                        <p className="truncate text-gray-500 mt-1" title={lead.resumo_caso}>{lead.resumo_caso}</p>
                                        <div className="mt-2 flex items-center gap-2">
                                            <div className="w-full bg-gray-200 rounded-full h-1.5 max-w-[100px]">
                                                <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${lead.probabilidade}%` }}></div>
                                            </div>
                                            <span className="text-xs font-medium">{Math.round(lead.probabilidade)}% Êxito</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right font-medium text-gray-900">
                                        {formatMoney(lead.valor_estimado)}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            {pagou ? (
                                                <button onClick={() => handleAction('reenviar_email', lead.id_analise)} title="Reenviar PDF" className="p-2 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100">
                                                    <Send size={16} />
                                                </button>
                                            ) : (
                                                <button onClick={() => handleAction('aprovar_manual', lead.id_analise)} title="Marcar Pago" className="p-2 bg-gray-100 text-gray-600 rounded-full hover:bg-green-100 hover:text-green-600">
                                                    <CheckSquare size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            )
                        })}
                        {leadsFiltrados.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                                    <div className="flex flex-col items-center gap-2">
                                        <Search size={32} />
                                        <p>Nenhum lead encontrado com os filtros atuais.</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}