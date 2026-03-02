import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { CheckCircle2, XCircle, Clock, FolderOpen, ArrowRight, TrendingUp } from "lucide-react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function Dashboard() {
  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: () => base44.entities.Client.list("-created_date"),
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ["tasks"],
    queryFn: () => base44.entities.Task.list(),
  });

  const approved = tasks.filter((t) => t.status === "approved").length;
  const rejected = tasks.filter((t) => t.status === "rejected").length;
  const under_review = tasks.filter((t) => t.status === "under_review").length;
  const activeClients = clients.filter((c) => c.status === "active").length;
  const total = tasks.length;
  const overallPercent = total ? Math.round((approved / total) * 100) : 0;

  const pieData = [
    { name: "Aprovadas", value: approved, color: "#22c55e" },
    { name: "Em Análise", value: under_review, color: "#eab308" },
    { name: "Reprovadas", value: rejected, color: "#f87171" },
  ].filter((d) => d.value > 0);

  const barData = clients.slice(0, 8).map((c) => {
    const ct = tasks.filter((t) => t.client_id === c.id);
    const app = ct.filter((t) => t.status === "approved").length;
    return {
      name: c.name.length > 14 ? c.name.slice(0, 14) + "…" : c.name,
      Aprovadas: app,
      "Em Análise": ct.filter((t) => t.status === "under_review").length,
      Reprovadas: ct.filter((t) => t.status === "rejected").length,
    };
  });

  const getClientProgress = (clientId) => {
    const clientTasks = tasks.filter((t) => t.client_id === clientId);
    if (!clientTasks.length) return { total: 0, approved: 0, percent: 0 };
    const app = clientTasks.filter((t) => t.status === "approved").length;
    return { total: clientTasks.length, approved: app, percent: Math.round((app / clientTasks.length) * 100) };
  };

  const stats = [
    { label: "Obras Ativas", value: activeClients, icon: FolderOpen, color: "bg-blue-50 text-blue-600", border: "border-blue-100" },
    { label: "Aprovadas", value: approved, icon: CheckCircle2, color: "bg-green-50 text-green-600", border: "border-green-100" },
    { label: "Em Análise", value: under_review, icon: Clock, color: "bg-yellow-50 text-yellow-600", border: "border-yellow-100" },
    { label: "Reprovadas", value: rejected, icon: XCircle, color: "bg-red-50 text-red-600", border: "border-red-100" },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="mb-2">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Visão geral de todas as obras</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className={`bg-white rounded-xl border ${stat.border} p-4`}>
            <div className={`inline-flex p-2 rounded-lg ${stat.color} mb-3`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Overall progress */}
      {total > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-500" />
              <h2 className="font-semibold text-gray-900">Progresso Geral</h2>
            </div>
            <span className="text-2xl font-bold text-gray-900">{overallPercent}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-3 mb-2">
            <div
              className="h-3 rounded-full transition-all"
              style={{
                width: `${overallPercent}%`,
                background: `linear-gradient(90deg, #22c55e, #16a34a)`
              }}
            />
          </div>
          <div className="flex gap-4 text-xs text-gray-500 mt-2">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" />{approved} aprovadas</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" />{under_review} em análise</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400 inline-block" />{rejected} reprovadas</span>
            <span className="flex items-center gap-1 ml-auto text-gray-400">{total} tarefas no total</span>
          </div>
        </div>
      )}

      {/* Charts row */}
      {total > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Pie chart */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="font-semibold text-gray-900 mb-4">Distribuição de Status</h2>
            <div className="flex items-center gap-4">
              <ResponsiveContainer width={140} height={140}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={2}>
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 flex-1">
                {pieData.map((d) => (
                  <div key={d.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
                      <span className="text-gray-600">{d.name}</span>
                    </div>
                    <span className="font-semibold text-gray-900">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bar chart */}
          {barData.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="font-semibold text-gray-900 mb-4">Tarefas por Obra</h2>
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={barData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="Aprovadas" stackId="a" fill="#22c55e" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="Em Análise" stackId="a" fill="#eab308" />
                  <Bar dataKey="Reprovadas" stackId="a" fill="#f87171" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* Projects List */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Obras Recentes</h2>
          <Link to={createPageUrl("Projects")} className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
            Ver todas <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        {clients.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <FolderOpen className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">Nenhuma obra criada ainda</p>
            <Link to={createPageUrl("Projects")} className="mt-3 inline-block text-sm text-blue-600 hover:underline">Criar primeira obra</Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {clients.slice(0, 8).map((client) => {
              const prog = getClientProgress(client.id);
              return (
                <Link
                  key={client.id}
                  to={`${createPageUrl("Projects")}?client=${client.id}`}
                  className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: client.color || "#3B82F6" }} />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{client.name}</p>
                      <p className="text-xs text-gray-400">{prog.total} tarefa{prog.total !== 1 ? "s" : ""} · {prog.approved} aprovadas</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-24 bg-gray-100 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full transition-all" style={{ width: `${prog.percent}%` }} />
                    </div>
                    <span className="text-xs font-semibold text-gray-600 w-9 text-right">{prog.percent}%</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}