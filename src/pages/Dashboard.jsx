import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { CheckCircle2, XCircle, Clock, FolderOpen, ArrowRight } from "lucide-react";

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

  const stats = [
    { label: "Obras Ativas", value: activeClients, icon: FolderOpen, color: "bg-blue-50 text-blue-600" },
    { label: "Aprovadas", value: approved, icon: CheckCircle2, color: "bg-green-50 text-green-600" },
    { label: "Em Análise", value: under_review, icon: Clock, color: "bg-yellow-50 text-yellow-600" },
    { label: "Reprovadas", value: rejected, icon: XCircle, color: "bg-red-50 text-red-600" },
  ];

  const getClientProgress = (clientId) => {
    const clientTasks = tasks.filter((t) => t.client_id === clientId);
    if (!clientTasks.length) return { total: 0, approved: 0, percent: 0 };
    const approved = clientTasks.filter((t) => t.status === "approved").length;
    return {
      total: clientTasks.length,
      approved,
      percent: Math.round((approved / clientTasks.length) * 100),
    };
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Visão geral de todas as obras</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className={`inline-flex p-2 rounded-lg ${stat.color} mb-3`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Projects List */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Obras Recentes</h2>
          <Link to={createPageUrl("Projects")} className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
            Ver todos <ArrowRight className="w-3 h-3" />
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
            {clients.slice(0, 6).map((client) => {
              const prog = getClientProgress(client.id);
              return (
                <Link
                  key={client.id}
                  to={`${createPageUrl("Projects")}?client=${client.id}`}
                  className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: client.color || "#3B82F6" }} />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{client.name}</p>
                      <p className="text-xs text-gray-400">{prog.total} tarefa{prog.total !== 1 ? "s" : ""}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-24 bg-gray-100 rounded-full h-1.5">
                      <div
                        className="bg-green-500 h-1.5 rounded-full transition-all"
                        style={{ width: `${prog.percent}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500 w-8 text-right">{prog.percent}%</span>
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