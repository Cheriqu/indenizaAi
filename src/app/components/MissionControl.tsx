import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/app/components/ui/table";
import { Badge } from "@/app/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { RefreshCw, Activity, Database, Cpu, HardDrive, CheckCircle2, Circle, Clock } from "lucide-react";
import { api } from "@/services/api";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend
} from 'recharts';

interface Metrics {
    system?: {
        cpu: number;
        memory_percent: number;
        memory_used_gb: number;
        memory_total_gb: number;
        disk_percent: number;
        disk_free_gb: number;
    };
    application?: {
        cache_items: number;
        cache_max: number;
        db_pool: string;
    };
    history?: {
        time: string;
        cpu: number;
        memory: number;
        disk: number;
    }[];
}

interface Analytics {
    history: {
        date: string;
        analyses: number;
        accesses: number;
    }[];
}

interface Task {
    id: number;
    task_name: string;
    status: string;
    last_run_at: string;
    next_run_at: string;
    result: string;
}

const MissionControl: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [metrics, setMetrics] = useState<Metrics | null>(null);
    const [analytics, setAnalytics] = useState<Analytics | null>(null);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [roadmap, setRoadmap] = useState<string>("");

    const fetchData = async () => {
        setLoading(true);
        try {
            try {
                const resMetrics = await api.get(`/admin/metrics`);
                setMetrics(resMetrics?.data || null);
            } catch (e) { console.warn("Falha metrics", e); }
            
            try {
                const resAnalytics = await api.get(`/admin/analytics`);
                setAnalytics(resAnalytics?.data || { history: [] });
            } catch (e) { console.warn("Falha analytics", e); }

            try {
                const resTasks = await api.get(`/admin/tasks`);
                setTasks(resTasks?.data || []);
            } catch (e) { console.warn("Falha tasks", e); }

            try {
                const resRoadmap = await api.get(`/admin/roadmap`);
                setRoadmap(resRoadmap?.data?.content || "");
            } catch (e) { console.warn("Falha roadmap", e); }

        } catch (error) {
            console.error("Erro geral:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 60000); 
        return () => clearInterval(interval);
    }, []);

    const getStatusColor = (val: number) => {
        if (val < 50) return "text-green-500";
        if (val < 80) return "text-yellow-500";
        return "text-red-500";
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr || dateStr === 'NaT') return '-';
        try {
            const date = new Date(dateStr);
            return date.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
        } catch { return dateStr; }
    };

    // --- CUSTOM ROADMAP RENDERER ---
    const parseInlineFormatting = (text: string) => {
        const parts = text.split(/(\*\*.*?\*\*)/g);
        return parts.map((part, index) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={index} className="font-bold text-gray-900">{part.slice(2, -2)}</strong>;
            }
            return part;
        });
    };

    const renderRoadmap = (markdown: string) => {
        if (!markdown) return <div className="text-gray-400 italic">Nenhum roadmap carregado.</div>;

        const lines = markdown.split('\n');
        return (
            <div className="space-y-2">
                {lines.map((line, index) => {
                    // Headers
                    if (line.startsWith('# ')) return <h1 key={index} className="text-2xl font-bold text-[#1c80b2] mt-6 mb-4 border-b pb-2">{line.replace('# ', '')}</h1>;
                    if (line.startsWith('## ')) return <h2 key={index} className="text-xl font-bold text-[#0f172a] mt-4 mb-2">{line.replace('## ', '')}</h2>;
                    if (line.startsWith('### ')) return <h3 key={index} className="text-lg font-semibold text-[#64748b] mt-3 mb-1">{line.replace('### ', '')}</h3>;

                    // Tasks
                    if (line.trim().startsWith('- [ ]')) {
                        return (
                            <div key={index} className="flex items-start gap-2 py-1 pl-4">
                                <Circle className="w-4 h-4 text-gray-300 mt-1 shrink-0" />
                                <span className="text-gray-600">{parseInlineFormatting(line.replace('- [ ]', '').trim())}</span>
                            </div>
                        );
                    }
                    if (line.trim().startsWith('- [x]')) {
                        return (
                            <div key={index} className="flex items-start gap-2 py-1 pl-4 bg-green-50/50 rounded-lg">
                                <CheckCircle2 className="w-4 h-4 text-green-500 mt-1 shrink-0" />
                                <span className="text-gray-800 line-through decoration-gray-400 decoration-1">{parseInlineFormatting(line.replace('- [x]', '').trim())}</span>
                            </div>
                        );
                    }

                    // Bullet points
                    if (line.trim().startsWith('- ')) {
                        return (
                            <div key={index} className="flex items-start gap-2 py-1 pl-4">
                                <div className="w-1.5 h-1.5 rounded-full bg-[#1c80b2] mt-2 shrink-0" />
                                <span className="text-gray-700">{parseInlineFormatting(line.replace('- ', '').trim())}</span>
                            </div>
                        );
                    }

                    // Empty lines
                    if (line.trim() === '') return <div key={index} className="h-2" />;

                    // Default Paragraph
                    return <p key={index} className="text-gray-600 leading-relaxed text-sm">{parseInlineFormatting(line)}</p>;
                })}
            </div>
        );
    };

    return (
        <div className="w-full px-6 py-6 space-y-6 animate-in fade-in duration-500 pb-20 bg-[#f8fafc] min-h-screen">
            <header className="flex justify-between items-center mb-6 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-3">
                    <span className="text-4xl">🚀</span>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-[#0f172a]">Mission Control</h1>
                        <p className="text-xs text-gray-500">System Overview & Analytics</p>
                    </div>
                </div>
                <Button variant="outline" size="icon" onClick={fetchData} disabled={loading} className="hover:bg-blue-50 hover:text-blue-600 transition-colors">
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
            </header>

            {/* STATUS CARDS */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">CPU Usage</CardTitle>
                        <Cpu className="h-4 w-4 text-[#1c80b2]" />
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${metrics?.system ? getStatusColor(metrics.system.cpu) : ''}`}>
                            {metrics?.system ? `${metrics.system.cpu}%` : '-'}
                        </div>
                        <p className="text-xs text-muted-foreground">Server Load</p>
                    </CardContent>
                </Card>
                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">Memory</CardTitle>
                        <Activity className="h-4 w-4 text-[#1c80b2]" />
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${metrics?.system ? getStatusColor(metrics.system.memory_percent) : ''}`}>
                            {metrics?.system ? `${metrics.system.memory_percent}%` : '-'}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {metrics?.system ? `${metrics.system.memory_used_gb}GB / ${metrics.system.memory_total_gb}GB` : '-'}
                        </p>
                    </CardContent>
                </Card>
                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">Disk Space</CardTitle>
                        <HardDrive className="h-4 w-4 text-[#1c80b2]" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-gray-700">
                            {metrics?.system ? `${metrics.system.disk_percent}%` : '-'}
                        </div>
                        <p className="text-xs text-muted-foreground">
                             {metrics?.system ? `${metrics.system.disk_free_gb}GB Free` : '-'}
                        </p>
                    </CardContent>
                </Card>
                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">App Cache</CardTitle>
                        <Database className="h-4 w-4 text-[#1c80b2]" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-gray-700">
                            {metrics?.application ? metrics.application.cache_items : '-'}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Items Cached
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* CHARTS SECTION */}
            <div className="grid gap-6 md:grid-cols-2">
                {/* System Metrics History */}
                <Card className="col-span-1 shadow-sm border-gray-100">
                    <CardHeader>
                        <CardTitle className="text-gray-700">Histórico do Sistema (24h)</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        {metrics?.history && metrics.history.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={metrics.history}>
                                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} vertical={false} />
                                    <XAxis dataKey="time" tick={{fontSize: 10, fill: '#94a3b8'}} minTickGap={30} axisLine={false} tickLine={false} />
                                    <YAxis domain={[0, 100]} tick={{fontSize: 10, fill: '#94a3b8'}} axisLine={false} tickLine={false} />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Legend />
                                    <Line type="monotone" dataKey="cpu" stroke="#ef4444" name="CPU %" strokeWidth={2} dot={false} activeDot={{r: 4}} />
                                    <Line type="monotone" dataKey="memory" stroke="#3b82f6" name="Memória %" strokeWidth={2} dot={false} />
                                    <Line type="monotone" dataKey="disk" stroke="#10b981" name="Disco %" strokeWidth={2} dot={false} />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full text-muted-foreground text-sm bg-gray-50 rounded-lg">
                                Aguardando dados históricos...
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Business Analytics */}
                <Card className="col-span-1 shadow-sm border-gray-100">
                    <CardHeader>
                        <CardTitle className="text-gray-700">Performance de Negócio (7 Dias)</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        {analytics?.history && analytics.history.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={analytics.history} barGap={0}>
                                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} vertical={false} />
                                    <XAxis dataKey="date" tick={{fontSize: 10, fill: '#94a3b8'}} axisLine={false} tickLine={false} />
                                    <YAxis tick={{fontSize: 10, fill: '#94a3b8'}} allowDecimals={false} axisLine={false} tickLine={false} />
                                    <Tooltip 
                                        cursor={{fill: '#f8fafc'}}
                                        contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Legend />
                                    <Bar dataKey="analyses" fill="#1c80b2" name="Análises" radius={[4, 4, 0, 0]} barSize={20} />
                                    <Bar dataKey="accesses" fill="#a3c852" name="Acessos" radius={[4, 4, 0, 0]} barSize={20} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full text-muted-foreground text-sm bg-gray-50 rounded-lg">
                                Nenhuma análise recente.
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="tasks" className="w-full">
                <TabsList className="grid w-full max-w-md grid-cols-2 mb-4 bg-gray-100 p-1 rounded-xl">
                    <TabsTrigger value="tasks" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#1c80b2] data-[state=active]:shadow-sm transition-all">Tarefas Agendadas</TabsTrigger>
                    <TabsTrigger value="roadmap" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#1c80b2] data-[state=active]:shadow-sm transition-all">Roadmap</TabsTrigger>
                </TabsList>
                
                <TabsContent value="tasks" className="animate-in slide-in-from-left-2 duration-300">
                    <Card className="border-none shadow-sm">
                        <CardHeader>
                            <CardTitle>OpenClaw Cron Jobs & System Tasks</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-xl border border-gray-100 overflow-hidden">
                                <Table>
                                    <TableHeader className="bg-gray-50">
                                        <TableRow>
                                            <TableHead className="font-bold text-gray-600">Tarefa</TableHead>
                                            <TableHead className="font-bold text-gray-600">Status</TableHead>
                                            <TableHead className="font-bold text-gray-600">Última Execução</TableHead>
                                            <TableHead className="font-bold text-gray-600">Próxima Execução</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {tasks.length > 0 ? tasks.map(task => (
                                            <TableRow key={task.id} className="hover:bg-gray-50/50">
                                                <TableCell className="font-medium flex items-center gap-2">
                                                    <div className="p-2 bg-blue-50 rounded-lg text-blue-600"><Clock size={16} /></div>
                                                    {task.task_name}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className={task.status === 'active' ? "bg-green-100 text-green-700 hover:bg-green-200 border-none px-3 py-1" : "bg-gray-100 text-gray-600"}>
                                                        {task.status === 'active' ? 'Ativo' : 'Inativo'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-sm font-mono text-gray-500">
                                                    {formatDate(task.last_run_at)}
                                                </TableCell>
                                                <TableCell className="text-sm font-mono text-gray-500">
                                                    {formatDate(task.next_run_at)}
                                                </TableCell>
                                            </TableRow>
                                        )) : (
                                            <TableRow>
                                                <TableCell colSpan={4} className="text-center text-gray-500 py-6">
                                                    Nenhuma tarefa agendada encontrada.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="roadmap" className="animate-in slide-in-from-right-2 duration-300">
                    <Card className="border-none shadow-sm">
                        <CardHeader className="border-b border-gray-100 pb-4">
                            <CardTitle>Roadmap & Changelog</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6">
                             {/* Renderizado Customizado */}
                             <div className="bg-white rounded-xl p-2 md:p-4">
                                {renderRoadmap(roadmap)}
                             </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default MissionControl;
