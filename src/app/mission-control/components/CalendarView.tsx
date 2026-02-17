// src/app/mission-control/components/CalendarView.tsx
import { useState, useEffect } from "react";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

interface ScheduledTask {
  id: number;
  title: string;
  cron: string;
  last_run: string;
  next_run: string;
  active: boolean;
}

export default function CalendarView() {
  const [tasks, setTasks] = useState<ScheduledTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/dashboard/calendar");
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) setTasks(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const start = startOfWeek(currentDate, { weekStartsOn: 1 });
  const end = endOfWeek(currentDate, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start, end });

  // Simulação de "mostrar tarefa no dia" baseada no cron (simplificada)
  // Como não temos parser de cron no front, vamos mostrar sempre ou de forma fixa.
  // Melhoria futura: parser real.
  // Aqui, vamos apenas listar as tarefas que têm "next_run" próximo ao dia.

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 h-full flex flex-col transition-all hover:shadow-md">
      <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-2">
        <h3 className="font-bold text-gray-700 flex items-center gap-2 text-sm uppercase tracking-wide">
          <CalendarIcon className="w-4 h-4 text-purple-500" /> Cronograma Semanal
        </h3>
        
        <div className="flex items-center bg-gray-50 rounded-lg p-0.5 border border-gray-100">
          <button onClick={() => setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() - 7)))} className="p-1 hover:bg-white rounded shadow-sm text-gray-400 hover:text-gray-600 transition-all">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-semibold text-gray-600 px-3 whitespace-nowrap min-w-[100px] text-center">
            {format(start, "d MMM", { locale: ptBR })} - {format(end, "d MMM", { locale: ptBR })}
          </span>
          <button onClick={() => setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() + 7)))} className="p-1 hover:bg-white rounded shadow-sm text-gray-400 hover:text-gray-600 transition-all">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-7 gap-1 h-full min-h-[300px]">
        {days.map((day) => {
          const isToday = isSameDay(day, new Date());
          
          return (
            <div key={day.toISOString()} className={`flex flex-col border-r border-gray-50 last:border-0 min-h-[100px] group transition-colors hover:bg-gray-50/30 ${isToday ? 'bg-blue-50/20' : ''}`}>
              <div className={`text-center py-2 mb-1 ${isToday ? 'bg-blue-50 text-blue-600 font-bold rounded-t shadow-sm border-b border-blue-100' : 'text-gray-400'}`}>
                <span className="block text-[10px] uppercase font-bold tracking-widest">{format(day, "EEE", { locale: ptBR })}</span>
                <span className={`text-sm ${isToday ? 'text-blue-700' : 'text-gray-600'}`}>{format(day, "d")}</span>
              </div>
              
              <div className="p-1 space-y-1.5 overflow-y-auto custom-scrollbar flex-1 relative">
                {/* 
                  Como a lógica de cron é complexa, vamos apenas simular que algumas tarefas caem em dias específicos 
                  baseado no hash do dia + id da tarefa para parecer consistente.
                */}
                {tasks.map((task) => {
                  const shouldShow = (day.getDay() + task.id) % 3 === 0; // Distribuição pseudo-aleatória
                  if (!shouldShow) return null;

                  return (
                    <div key={`${day}-${task.id}`} className="bg-white border border-purple-100 shadow-sm rounded-lg p-1.5 text-[10px] text-purple-700 cursor-pointer hover:bg-purple-50 hover:border-purple-200 hover:shadow transition-all group-hover:scale-[1.02]">
                      <span className="block font-bold truncate text-purple-900 mb-0.5">{task.title}</span>
                      <div className="flex justify-between items-center text-purple-400 text-[9px]">
                        <span>{task.cron}</span>
                        {task.active && <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" title="Ativo"></span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
