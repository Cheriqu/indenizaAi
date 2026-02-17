// src/app/mission-control/components/ActivityFeed.tsx
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Activity, Clock, Loader2, RefreshCw } from "lucide-react";

interface ActivityLog {
  id: number;
  timestamp: string;
  action: string;
  details: string; // JSON string
  status: string;
}

export default function ActivityFeed() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/dashboard/activity");
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) setLogs(data);
      } else {
        console.error("Erro ao buscar logs:", response.status);
      }
    } catch (err) {
      console.error("Erro rede:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 15000); // Auto-refresh 15s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 h-full flex flex-col transition-all hover:shadow-md">
      <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-2">
        <h3 className="font-bold text-gray-700 flex items-center gap-2 text-sm uppercase tracking-wide">
          <Activity className="w-4 h-4 text-blue-500" /> Histórico de Atividades
        </h3>
        <button onClick={fetchLogs} className="p-1 hover:bg-gray-50 rounded-full transition-colors" title="Atualizar">
          <RefreshCw className={`w-3 h-3 text-gray-400 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3 max-h-[400px]">
        {loading && logs.length === 0 ? (
          <div className="flex justify-center p-8"><Loader2 className="animate-spin text-gray-300 w-8 h-8" /></div>
        ) : logs.length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-8">Nenhuma atividade registrada.</p>
        ) : (
          logs.map((log) => {
            let detailsObj: any = {};
            try { detailsObj = JSON.parse(log.details); } catch(e) {}
            
            // Tratamento de detalhes para exibição mais limpa
            const detailText = detailsObj.detail || detailsObj.description || JSON.stringify(detailsObj);

            return (
              <div key={log.id} className="group flex gap-3 p-3 hover:bg-blue-50/50 rounded-lg transition-colors border border-transparent hover:border-blue-100">
                <div className={`mt-1.5 min-w-[8px] h-2 rounded-full ${log.status === 'SUCCESS' ? 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.4)]' : 'bg-red-400'}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-2">
                    <span className="font-semibold text-gray-800 text-xs uppercase tracking-tight">{log.action}</span>
                    <span className="text-[10px] text-gray-400 whitespace-nowrap flex items-center gap-1 bg-gray-50 px-1.5 py-0.5 rounded">
                      <Clock className="w-2.5 h-2.5" />
                      {format(new Date(log.timestamp), "dd/MM HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1 line-clamp-2 leading-relaxed" title={detailText}>
                    {detailText}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
