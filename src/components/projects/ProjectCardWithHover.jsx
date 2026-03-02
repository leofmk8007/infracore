import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Button } from "@/components/ui/button";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function ProjectCardWithHover({ client, tasks, onEdit, onDelete, onSelect }) {
  const clientTasks = tasks.filter((t) => t.client_id === client.id);
  const approvedCount = clientTasks.filter((t) => t.status === "approved").length;
  const rejectedCount = clientTasks.filter((t) => t.status === "rejected").length;
  const totalCount = clientTasks.length;

  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <div
          onClick={() => onSelect(client)}
          className="bg-white rounded-lg border border-gray-200 p-4 cursor-pointer hover:shadow-md transition-all hover:border-blue-300"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              {client.icon_url && (
                <img src={client.icon_url} alt="icon" className="w-8 h-8 rounded-lg mb-2 object-cover" />
              )}
              <h4 className="font-semibold text-gray-900 truncate text-sm">{client.name}</h4>
              <p className="text-xs text-gray-500 truncate mt-1">{client.description || "Sem descrição"}</p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                  <MoreVertical className="w-4 h-4 text-gray-400" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(client); }}>
                  <Pencil className="w-4 h-4 mr-2" /> Editar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDelete(client); }} className="text-red-600">
                  <Trash2 className="w-4 h-4 mr-2" /> Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {totalCount > 0 && (
            <div className="mt-3 pt-2 border-t border-gray-100 text-xs">
              <div className="flex justify-between text-gray-600">
                <span>Tarefas: {totalCount}</span>
                <span className="text-green-600">✓ {approvedCount}</span>
              </div>
            </div>
          )}
        </div>
      </HoverCardTrigger>

      <HoverCardContent className="w-72">
        <div className="space-y-3">
          <div>
            <h4 className="font-semibold text-gray-900">{client.name}</h4>
            <p className="text-sm text-gray-600 mt-1">{client.description || "Sem descrição"}</p>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-blue-50 rounded-lg p-2">
              <div className="font-semibold text-blue-900">{totalCount}</div>
              <div className="text-xs text-blue-700">Total</div>
            </div>
            <div className="bg-green-50 rounded-lg p-2">
              <div className="font-semibold text-green-900">{approvedCount}</div>
              <div className="text-xs text-green-700">Aprovadas</div>
            </div>
            <div className="bg-red-50 rounded-lg p-2">
              <div className="font-semibold text-red-900">{rejectedCount}</div>
              <div className="text-xs text-red-700">Rejeitadas</div>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button size="sm" onClick={() => onSelect(client)} className="flex-1">
              Ver detalhes
            </Button>
            <Button size="sm" variant="outline" onClick={() => onEdit(client)}>
              Editar
            </Button>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}