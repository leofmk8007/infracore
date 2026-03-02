import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { CheckCircle2, XCircle, Clock, Plus, Pencil, Trash2, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const DEFAULT_TASK_STATUSES = [
  { id: "under_review", label: "Em análise", color: "#F59E0B" },
  { id: "approved", label: "Aprovada", color: "#10B981" },
  { id: "rejected", label: "Reprovada", color: "#EF4444" },
];

const STATUS_ICON = {
  under_review: Clock,
  approved: CheckCircle2,
  rejected: XCircle,
};

function TaskRow({ task, onStatusChange, onDelete, onEdit, taskStatuses }) {
  const statusConfig = taskStatuses.find(s => s.id === task.status);
  const label = statusConfig?.label || "Desconhecido";
  const color = statusConfig?.color || "#6B7280";
  const Icon = STATUS_ICON[task.status] || Clock;

  const statusIds = taskStatuses.map(s => s.id);
  const currentIdx = statusIds.indexOf(task.status);
  const nextStatus = statusIds[(currentIdx + 1) % statusIds.length];

  return (
    <div className="flex items-start gap-3 py-3 px-4 hover:bg-gray-50 rounded-lg group transition-colors">
      <button
        onClick={() => onStatusChange(task, nextStatus)}
        className="mt-0.5 flex-shrink-0"
        title="Clique para mudar status"
      >
        <Icon className="w-5 h-5" style={{ color }} />
      </button>

      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${task.status === "rejected" ? "line-through text-gray-400" : "text-gray-900"}`}>
          {task.title}
        </p>
        {task.description && (
          <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{task.description}</p>
        )}
      </div>

      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
        <span className="text-xs px-2 py-0.5 rounded-full border font-medium" style={{ backgroundColor: color + "20", color, borderColor: color }}>
          {label}
        </span>
        <button onClick={() => onEdit(task)} className="p-1 text-gray-400 hover:text-gray-700 rounded">
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button onClick={() => onDelete(task)} className="p-1 text-gray-400 hover:text-red-500 rounded">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
      <span className="text-xs px-2 py-0.5 rounded-full border font-medium opacity-100 group-hover:hidden flex-shrink-0" style={{ backgroundColor: color + "20", color, borderColor: color }}>
        {label}
      </span>
    </div>
  );
}

function TaskForm({ clientId, task, onClose, taskStatuses }) {
  const [form, setForm] = useState({ 
    title: task?.title || "", 
    description: task?.description || "", 
    status: task?.status || (taskStatuses[0]?.id || "under_review")
  });
  const qc = useQueryClient();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    if (task) {
      await base44.entities.Task.update(task.id, form);
    } else {
      await base44.entities.Task.create({ ...form, client_id: clientId, status: form.status });
    }
    qc.invalidateQueries(["tasks"]);
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="bg-blue-50 border border-blue-100 rounded-lg p-4 mt-2 space-y-3">
      <Input
        autoFocus
        placeholder="Título da tarefa *"
        value={form.title}
        onChange={(e) => setForm({ ...form, title: e.target.value })}
        required
        className="bg-white"
      />
      <Textarea
        placeholder="Descrição (opcional)"
        value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
        rows={2}
        className="bg-white"
      />
      {task && (
        <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
          <SelectTrigger className="bg-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {taskStatuses.map(status => (
              <SelectItem key={status.id} value={status.id}>
                {status.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      <div className="flex gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onClose}>Cancelar</Button>
        <Button type="submit" size="sm">{task ? "Salvar" : "Adicionar"}</Button>
      </div>
    </form>
  );
}

export default function TaskList({ client, tasks, onBack }) {
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [filter, setFilter] = useState("all");
  const qc = useQueryClient();

  const { data: taskCustomList = [] } = useQuery({
    queryKey: ["task_customization"],
    queryFn: () => base44.entities.TaskCustomization.list(),
  });

  const taskCustom = taskCustomList[0];
  const taskStatuses = taskCustom?.statuses || DEFAULT_TASK_STATUSES;

  const clientTasks = tasks.filter((t) => t.client_id === client.id);

  const filteredTasks = filter === "all" ? clientTasks : clientTasks.filter((t) => t.status === filter);

  const firstStatusId = taskStatuses[0]?.id || "approved";
  const approved = clientTasks.filter((t) => t.status === firstStatusId).length;
  const percent = clientTasks.length ? Math.round((approved / clientTasks.length) * 100) : 0;

  const handleStatusChange = async (task, newStatus) => {
    await base44.entities.Task.update(task.id, { status: newStatus });
    qc.invalidateQueries(["tasks"]);
  };

  const handleDelete = async (task) => {
    await base44.entities.Task.delete(task.id);
    qc.invalidateQueries(["tasks"]);
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-5 transition-colors">
        <ChevronLeft className="w-4 h-4" /> Voltar para projetos
      </button>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Project Header */}
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: client.color || "#3B82F6" }} />
            <h2 className="text-xl font-bold text-gray-900">{client.name}</h2>
          </div>
          {client.description && <p className="text-sm text-gray-500 mb-4">{client.description}</p>}

          {/* Progress */}
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-gray-100 rounded-full h-2">
              <div className="bg-green-500 h-2 rounded-full transition-all" style={{ width: `${percent}%` }} />
            </div>
            <span className="text-sm font-semibold text-gray-700">{percent}%</span>
          </div>
          <div className="flex gap-4 mt-3 text-xs text-gray-500">
            <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> {approved} aprovadas</span>
            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-yellow-500" /> {clientTasks.filter(t => t.status === "under_review").length} em análise</span>
            <span className="flex items-center gap-1"><XCircle className="w-3.5 h-3.5 text-red-400" /> {clientTasks.filter(t => t.status === "rejected").length} reprovadas</span>
          </div>
        </div>

        {/* Filter + Add */}
        <div className="px-4 pt-4 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex gap-1 text-xs">
            {[["all", "Todas"], ["under_review", "Em análise"], ["approved", "Aprovadas"], ["rejected", "Reprovadas"]].map(([val, lbl]) => (
              <button
                key={val}
                onClick={() => setFilter(val)}
                className={`px-3 py-1 rounded-full border font-medium transition-colors ${filter === val ? "bg-gray-900 text-white border-gray-900" : "text-gray-600 border-gray-200 hover:bg-gray-50"}`}
              >
                {lbl}
              </button>
            ))}
          </div>
          <Button size="sm" onClick={() => { setShowForm(true); setEditingTask(null); }} className="flex items-center gap-1">
            <Plus className="w-4 h-4" /> Nova tarefa
          </Button>
        </div>

        {/* Form */}
        <div className="px-4">
          {showForm && !editingTask && (
            <TaskForm clientId={client.id} onClose={() => setShowForm(false)} />
          )}
        </div>

        {/* Tasks */}
        <div className="p-4 space-y-0.5 min-h-[100px]">
          {filteredTasks.length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-sm">
              {clientTasks.length === 0 ? "Nenhuma tarefa ainda. Adicione a primeira!" : "Nenhuma tarefa neste filtro."}
            </div>
          ) : (
            filteredTasks.map((task) =>
              editingTask?.id === task.id ? (
                <div key={task.id} className="px-0">
                  <TaskForm clientId={client.id} task={task} onClose={() => setEditingTask(null)} />
                </div>
              ) : (
                <TaskRow
                  key={task.id}
                  task={task}
                  onStatusChange={handleStatusChange}
                  onDelete={handleDelete}
                  onEdit={(t) => { setEditingTask(t); setShowForm(false); }}
                />
              )
            )
          )}
        </div>
      </div>
    </div>
  );
}