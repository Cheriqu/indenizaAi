// src/app/mission-control/index.tsx
import { useEffect, useState } from "react";
import { 
  LayoutDashboard, 
  Users, 
  DollarSign, 
  TrendingUp, 
  Globe,
  Loader2,
  Calendar as CalendarIcon,
  Activity,
  Search
} from "lucide-react";
import ActivityFeed from "./components/ActivityFeed";
import CalendarView from "./components/CalendarView";
import GlobalSearch from "./components/GlobalSearch";

interface DashboardStats {
  total_leads: number;
  total_vendas: number;
  leads_hoje: number;
  valor_recuperavel: number;
  recent_leads: Array<{
    nome: string;
    data: string;
    pagou: boolean;
    categoria: string;
    source: string;
    campaign: string;
  }>;
}

export default function MissionControlPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/stats")
      .then(res => res.json())
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const formatCurrency = (val: number) => 
    val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="min-h-screen bg-[#f3f4f6] font-archivo text-gray-800 p-4 md:p-8">
      {/* HEADER */}
      <header className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#0f172a] flex items-center gap-3">
            <LayoutDashboard className="text-[#1c80b2] w-8 h-8" />
            Mission Control
          </h1>
          <p className="text-gray-500 text-sm mt-1">Visão geral do sistema IndenizaAi</p>
        </div>
        <div className="w-full md:w-auto">
          <GlobalSearch />
        </div>
      </header>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="animate-spin text-[#1c80b2] w-10 h-10" />
        </div>
      ) : (
        <div className="max-w-7xl mx-auto space-y-8">
          
          {/* KPI CARDS */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between h-32">
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Leads</span>
                <Users className="text-blue-500 w-5 h-5 bg-blue-50 rounded p-0.5" />
              </div>
              <div className="text-3xl font-bold text-gray-800">{stats?.total_leads}</div>
              <div className="text-xs text-gray-400">
                <span className="text-green-500 font-bold">+{stats?.leads_hoje}</span> hoje
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between h-32">
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Vendas Confirmadas</span>
                <DollarSign className="text-green-500 w-5 h-5 bg-green-50 rounded p-0.5" />
              </div>
              <div className="text-3xl font-bold text-gray-800">{stats?.total_vendas}</div>
              <div className="text-xs text-gray-400">Taxa conv: {stats?.total_leads ? ((stats.total_vendas / stats.total_leads)*100).toFixed(1) : 0}%</div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between h-32">
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Recuperável (Est.)</span>
                <TrendingUp className="text-purple-500 w-5 h-5 bg-purple-50 rounded p-0.5" />
              </div>
              <div className="text-2xl font-bold text-gray-800 truncate" title={formatCurrency(stats?.valor_recuperavel || 0)}>
                {formatCurrency(stats?.valor_recuperavel || 0)}
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between h-32">
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Tráfego Hoje</span>
                <Globe className="text-orange-500 w-5 h-5 bg-orange-50 rounded p-0.5" />
              </div>
              <div className="text-3xl font-bold text-gray-800">{stats?.leads_hoje}</div>
              <div className="text-xs text-gray-400">Leads capturados</div>
            </div>
          </div>

          {/* MAIN GRID */}
          <div className="grid md:grid-cols-3 gap-6 h-[500px]">
            {/* LEFT COL: Recent Leads + UTMs */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col h-full overflow-hidden">
              <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-500" /> Leads Recentes
              </h3>
              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
                {stats?.recent_leads?.map((lead, i) => (
                  <div key={i} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div>
                      <div className="font-bold text-sm text-gray-800 flex items-center gap-2">
                        {lead.nome}
                        {lead.pagou && <span className="bg-green-100 text-green-700 text-[10px] px-1.5 py-0.5 rounded font-bold">PAGO</span>}
                      </div>
                      <div className="text-xs text-gray-500">{lead.categoria}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] font-mono bg-blue-100 text-blue-800 px-1.5 rounded inline-block mb-1">
                        {lead.source}
                      </div>
                      <div className="text-[10px] text-gray-400">{lead.campaign}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* CENTER COL: Activity Feed */}
            <div className="h-full">
              <ActivityFeed />
            </div>

            {/* RIGHT COL: Calendar */}
            <div className="h-full">
              <CalendarView />
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
