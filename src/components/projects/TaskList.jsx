import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, XCircle, Clock, Plus, Pencil, Trash2, ChevronLeft, Folder, FolderOpen, ChevronDown, ChevronRight, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import TaskDetailModal from "./TaskDetailModal";

const STATUS_CONFIG = {
  under_review: { label: "Em análise", icon: Clock, className: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  approved: { label: "Aprovada", icon: CheckCircle2, className: "bg-green-100 text-green-700 border-green-200" },
  rejected: { label: "Reprovada", icon: XCircle, className: "bg-red-100 text-red-700 border-red-200" },
};

// ─── Folder section grouped by SubProject ───
function FolderSection({ subProject, allSubProjects, tasks, clientId, depth = 0, onOpenDetail }) {
  const [open, setOpen] = useState(true);
  const [editingTask, setEditingTask] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const qc = useQueryClient();

  const children = allSubProjects.filter((s) => s.parent_id === subProject.id);
  const myTasks = tasks.filter((t) => t.sub_project_id === subProject.id);
  const approved = myTasks.filter((t) => t.status === "approved").length;
  const percent = myTasks.length ? Math.round((approved / myTasks.length) * 100) : 0;

  const handleStatusChange = async (task, newStatus) => {
    await base44.entities.Task.update(task.id, { status: newStatus });
    qc.invalidateQueries(["tasks"]);
  };

  const handleDelete = async (task) => {
    await base44.entities.Task.delete(task.id);
    qc.invalidateQueries(["tasks"]);
  };

  const nextStatus = { under_review: "approved", approved: "rejected", rejected: "under_review" };

  return (
    <div className="border-l-2 border-gray-100 pl-2">
      {/* Folder header */}
      <div
        className="flex items-center gap-1.5 py-2 px-2 rounded-lg hover:bg-gray-50 cursor-pointer group"
        onClick={() => setOpen(!open)}
      >
        {open ? <ChevronDown className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />}
        {open ? <FolderOpen className="w-4 h-4 text-amber-400 flex-shrink-0" /> : <Folder className="w-4 h-4 text-amber-400 flex-shrink-0" />}
        <span className="text-sm font-semibold text-gray-800 flex-1">{subProject.name}</span>
        {myTasks.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-gray-400 mr-2">
            <div className="w-16 bg-gray-200 rounded-full h-1.5">
              <div className="bg-green-400 h-1.5 rounded-full" style={{ width: `${percent}%` }} />
            </div>
            <span>{percent}%</span>
            <span className="text-gray-300">·</span>
            <span className="flex items-center gap-0.5"><CheckCircle2 className="w-3 h-3 text-green-500" />{approved}</span>
            <span className="flex items-center gap-0.5"><Clock className="w-3 h-3 text-yellow-500" />{myTasks.filter(t=>t.status==="under_review").length}</span>
            <span className="flex items-center gap-0.5"><XCircle className="w-3 h-3 text-red-400" />{myTasks.filter(t=>t.status==="rejected").length}</span>
          </div>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); setShowForm(true); setEditingTask(null); }}
          className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-blue-600 rounded"
          title="Nova tarefa"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {open && (
        <div className="ml-4 space-y-0.5">
          {/* Child folders */}
          {children.map((child) => (
            <FolderSection
              key={child.id}
              subProject={child}
              allSubProjects={allSubProjects}
              tasks={tasks}
              clientId={clientId}
              depth={depth + 1}
              onOpenDetail={onOpenDetail}
            />
          ))}

          {/* New task form */}
          {showForm && !editingTask && (
            <TaskForm clientId={clientId} subProjectId={subProject.id} onClose={() => setShowForm(false)} />
          )}

          {/* Tasks */}
          {myTasks.map((task) =>
            editingTask?.id === task.id ? (
              <TaskForm key={task.id} clientId={clientId} task={task} onClose={() => setEditingTask(null)} />
            ) : (
              <div key={task.id} className="flex items-start gap-2 py-1.5 px-2 rounded-lg hover:bg-gray-50 group transition-colors">
                <FileText className="w-3.5 h-3.5 text-gray-300 flex-shrink-0 mt-0.5" />
                <button
                  onClick={() => handleStatusChange(task, nextStatus[task.status])}
                  className="flex-shrink-0 mt-0.5"
                >
                  {task.status === "approved" && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                  {task.status === "under_review" && <Clock className="w-4 h-4 text-yellow-500" />}
                  {task.status === "rejected" && <XCircle className="w-4 h-4 text-red-400" />}
                </button>
                <button
                  className={`text-sm flex-1 text-left hover:text-blue-600 transition-colors ${task.status === "rejected" ? "line-through text-gray-400" : "text-gray-800"}`}
                  onClick={() => onOpenDetail(task)}
                >
                  {task.title}
                  {task.description && <span className="block text-xs text-gray-400 font-normal line-clamp-1">{task.description}</span>}
                </button>
                <span className={`text-xs px-1.5 py-0.5 rounded-full border font-medium flex-shrink-0 opacity-0 group-hover:opacity-100 ${STATUS_CONFIG[task.status]?.className}`}>
                  {STATUS_CONFIG[task.status]?.label}
                </span>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 flex-shrink-0">
                  <button onClick={() => setEditingTask(task)} className="p-1 text-gray-400 hover:text-gray-700 rounded"><Pencil className="w-3 h-3" /></button>
                  <button onClick={() => handleDelete(task)} className="p-1 text-gray-400 hover:text-red-500 rounded"><Trash2 className="w-3 h-3" /></button>
                </div>
              </div>
            )
          )}

          {children.length === 0 && myTasks.length === 0 && !showForm && (
            <p className="text-xs text-gray-400 py-1 italic">Pasta vazia</p>
          )}
        </div>
      )}
    </div>
  );
}

function TaskForm({ clientId, subProjectId, task, onClose }) {
  const [form, setForm] = useState({ title: task?.title || "", description: task?.description || "" });
  const qc = useQueryClient();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    if (task) {
      await base44.entities.Task.update(task.id, form);
    } else {
      await base44.entities.Task.create({ ...form, client_id: clientId, sub_project_id: subProjectId || null, status: "under_review" });
    }
    qc.invalidateQueries(["tasks"]);
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="bg-blue-50 border border-blue-100 rounded-lg p-3 mt-1 space-y-2">
      <Input autoFocus placeholder="Título da tarefa *" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required className="bg-white h-7 text-sm" />
      <Textarea placeholder="Descrição (opcional)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="bg-white text-sm" />
      <div className="flex gap-2">
        <Button type="button" variant="outline" size="sm" className="h-7 text-xs" onClick={onClose}>Cancelar</Button>
        <Button type="submit" size="sm" className="h-7 text-xs">{task ? "Salvar" : "Adicionar"}</Button>
      </div>
    </form>
  );
}

export default function TaskList({ client, tasks, onBack }) {
  const [detailTask, setDetailTask] = useState(null);
  const qc = useQueryClient();

  const { data: subProjects = [] } = useQuery({
    queryKey: ["subprojects"],
    queryFn: () => base44.entities.SubProject.list(),
  });

  const clientTasks = tasks.filter((t) => t.client_id === client.id);
  const clientSubProjects = subProjects.filter((s) => s.client_id === client.id);
  const rootSubProjects = clientSubProjects.filter((s) => !s.parent_id);

  // Tasks not assigned to any sub_project
  const unassignedTasks = clientTasks.filter((t) => !t.sub_project_id);

  const approved = clientTasks.filter((t) => t.status === "approved").length;
  const percent = clientTasks.length ? Math.round((approved / clientTasks.length) * 100) : 0;

  const handleStatusChange = async (task, newStatus) => {
    await base44.entities.Task.update(task.id, { status: newStatus });
    qc.invalidateQueries(["tasks"]);
  };

  const handleDelete = async (task) => {
    await base44.entities.Task.delete(task.id);
    qc.invalidateQueries(["tasks"]);
  };

  const nextStatus = { under_review: "approved", approved: "rejected", rejected: "under_review" };

  return (
    <div className="max-w-3xl mx-auto">
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

        {/* Content */}
        <div className="p-4 space-y-1">
          {clientSubProjects.length === 0 && unassignedTasks.length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-sm">Nenhuma tarefa ainda.</div>
          ) : (
            <>
              {/* Folder sections */}
              {rootSubProjects.map((sub) => (
                <FolderSection
                  key={sub.id}
                  subProject={sub}
                  allSubProjects={clientSubProjects}
                  tasks={tasks}
                  clientId={client.id}
                  depth={0}
                  onOpenDetail={(t) => setDetailTask(t)}
                />
              ))}

              {/* Unassigned tasks */}
              {unassignedTasks.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs text-gray-400 font-medium px-2 mb-1">Sem pasta</p>
                  {unassignedTasks.map((task) => (
                    <div key={task.id} className="flex items-start gap-2 py-1.5 px-2 rounded-lg hover:bg-gray-50 group transition-colors">
                      <FileText className="w-3.5 h-3.5 text-gray-300 flex-shrink-0 mt-0.5" />
                      <button onClick={() => handleStatusChange(task, nextStatus[task.status])} className="flex-shrink-0 mt-0.5">
                        {task.status === "approved" && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                        {task.status === "under_review" && <Clock className="w-4 h-4 text-yellow-500" />}
                        {task.status === "rejected" && <XCircle className="w-4 h-4 text-red-400" />}
                      </button>
                      <button
                        className={`text-sm flex-1 text-left hover:text-blue-600 ${task.status === "rejected" ? "line-through text-gray-400" : "text-gray-800"}`}
                        onClick={() => setDetailTask(task)}
                      >
                        {task.title}
                      </button>
                      <button onClick={() => handleDelete(task)} className="p-1 text-gray-400 hover:text-red-500 rounded opacity-0 group-hover:opacity-100"><Trash2 className="w-3 h-3" /></button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <TaskDetailModal
        task={detailTask}
        open={!!detailTask}
        onClose={() => setDetailTask(null)}
      />
    </div>
  );
}