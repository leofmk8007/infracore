import { CheckCircle2, XCircle, Clock, ChevronRight, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const statusLabels = {
  active: { label: "Ativo", className: "bg-blue-100 text-blue-700" },
  completed: { label: "Concluído", className: "bg-green-100 text-green-700" },
  on_hold: { label: "Em espera", className: "bg-gray-100 text-gray-600" },
};

export default function ClientCard({ client, tasks, onClick, onEdit, onDelete }) {
  const clientTasks = tasks.filter((t) => t.client_id === client.id);
  const approved = clientTasks.filter((t) => t.status === "approved").length;
  const rejected = clientTasks.filter((t) => t.status === "rejected").length;
  const under_review = clientTasks.filter((t) => t.status === "under_review").length;
  const percent = clientTasks.length ? Math.round((approved / clientTasks.length) * 100) : 0;
  const st = statusLabels[client.status] || statusLabels.active;

  return (
    <div
      className="bg-white rounded-xl border border-gray-200 hover:shadow-md transition-shadow cursor-pointer group"
      onClick={onClick}
    >
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2.5">
            {client.icon_url ? (
              <img src={client.icon_url} alt="ícone" className="w-7 h-7 rounded-lg object-cover flex-shrink-0" />
            ) : (
              <div className="w-7 h-7 rounded-lg flex-shrink-0" style={{ backgroundColor: (client.color || "#3B82F6") + "30" }}>
                <div className="w-full h-full flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: client.color || "#3B82F6" }} />
                </div>
              </div>
            )}
            <h3 className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">{client.name}</h3>
          </div>
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${st.className}`}>{st.label}</span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-1 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700">
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(client)}>
                  <Pencil className="w-4 h-4 mr-2" /> Editar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDelete(client)} className="text-red-600">
                  <Trash2 className="w-4 h-4 mr-2" /> Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {client.description && (
          <p className="text-sm text-gray-500 mb-4 line-clamp-2">{client.description}</p>
        )}

        {/* Progress */}
        <div className="mb-4">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Progresso</span>
            <span>{percent}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div className="bg-green-500 h-2 rounded-full transition-all" style={{ width: `${percent}%` }} />
          </div>
        </div>

        {/* Task Stats */}
        <div className="flex gap-4 text-xs">
          <span className="flex items-center gap-1 text-green-600">
            <CheckCircle2 className="w-3.5 h-3.5" /> {approved} Aprovadas
          </span>
          <span className="flex items-center gap-1 text-yellow-600">
            <Clock className="w-3.5 h-3.5" /> {under_review} Em análise
          </span>
          <span className="flex items-center gap-1 text-red-500">
            <XCircle className="w-3.5 h-3.5" /> {rejected} Reprovadas
          </span>
        </div>
      </div>

      <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
        <span>{clientTasks.length} tarefa{clientTasks.length !== 1 ? "s" : ""} no total</span>
        <ChevronRight className="w-4 h-4 group-hover:text-blue-600 transition-colors" />
      </div>
    </div>
  );
}