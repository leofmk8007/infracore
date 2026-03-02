import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import {
  Folder, FolderOpen, ChevronRight, ChevronDown, Plus, Pencil, Trash2,
  CheckCircle2, XCircle, Clock, ChevronLeft, FileText, ShieldAlert
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import TaskDetailModal from "./TaskDetailModal";

const STATUS_CONFIG = {
  under_review: { label: "Em análise", icon: Clock, color: "text-yellow-500", badge: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  approved: { label: "Aprovada", icon: CheckCircle2, color: "text-green-500", badge: "bg-green-100 text-green-700 border-green-200" },
  rejected: { label: "Reprovada", icon: XCircle, color: "text-red-400", badge: "bg-red-100 text-red-700 border-red-200" },
};

// ─── Inline form for sub-projects (admin only) ───
function SubProjectForm({ clientId, parentId, subProject, onClose }) {
  const [name, setName] = useState(subProject?.name || "");
  const qc = useQueryClient();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (subProject) {
      await base44.entities.SubProject.update(subProject.id, { name });
    } else {
      await base44.entities.SubProject.create({ name, client_id: clientId, parent_id: parentId || null });
    }
    qc.invalidateQueries(["subprojects"]);
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 py-1 px-2 bg-blue-50 rounded-lg border border-blue-100">
      <Input autoFocus placeholder="Nome do serviço *" value={name} onChange={(e) => setName(e.target.value)} required className="bg-white h-7 text-sm flex-1" />
      <Button type="submit" size="sm" className="h-7 px-3 text-xs">{subProject ? "Salvar" : "Criar"}</Button>
      <Button type="button" variant="outline" size="sm" className="h-7 px-3 text-xs" onClick={onClose}>X</Button>
    </form>
  );
}

// ─── Inline form for tasks (admin only) ───
function TaskForm({ clientId, subProjectId, task, onClose }) {
  const [title, setTitle] = useState(task?.title || "");
  const qc = useQueryClient();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    if (task) {
      await base44.entities.Task.update(task.id, { title });
    } else {
      await base44.entities.Task.create({ title, client_id: clientId, sub_project_id: subProjectId, status: "under_review" });
    }
    qc.invalidateQueries(["tasks"]);
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 py-1 px-2 bg-gray-50 rounded-lg border border-gray-200">
      <Input autoFocus placeholder="Título da tarefa *" value={title} onChange={(e) => setTitle(e.target.value)} required className="bg-white h-7 text-sm flex-1" />
      <Button type="submit" size="sm" className="h-7 px-3 text-xs">{task ? "Salvar" : "Adicionar"}</Button>
      <Button type="button" variant="outline" size="sm" className="h-7 px-3 text-xs" onClick={onClose}>X</Button>
    </form>
  );
}

// ─── Task Row ───
function TaskRow({ task, onStatusChange, onEdit, onDelete, onOpenDetail, isAdmin }) {
  const cfg = STATUS_CONFIG[task.status] || STATUS_CONFIG.under_review;
  const Icon = cfg.icon;
  const nextStatus = { under_review: "approved", approved: "rejected", rejected: "under_review" };

  return (
    <div className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-gray-50 group">
      <FileText className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
      <button onClick={() => onStatusChange(task, nextStatus[task.status])} className="flex-shrink-0" title="Mudar status">
        <Icon className={`w-4 h-4 ${cfg.color}`} />
      </button>
      <button
        onClick={() => onOpenDetail(task)}
        className={`text-sm flex-1 text-left hover:text-blue-600 transition-colors ${task.status === "rejected" ? "line-through text-gray-400" : "text-gray-800"}`}
      >
        {task.title}
      </button>
      <span className={`text-xs px-1.5 py-0.5 rounded-full border font-medium ${cfg.badge} opacity-0 group-hover:opacity-100`}>
        {cfg.label}
      </span>
      {isAdmin && (
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => onEdit(task)} className="p-1 text-gray-400 hover:text-gray-700 rounded"><Pencil className="w-3 h-3" /></button>
          <button onClick={() => onDelete(task)} className="p-1 text-gray-400 hover:text-red-500 rounded"><Trash2 className="w-3 h-3" /></button>
        </div>
      )}
    </div>
  );
}

// ─── Recursive SubProject Node ───
function SubProjectNode({ subProject, allSubProjects, tasks, clientId, depth = 0, onDeleteSub, onEditSub, isAdmin }) {
  const [open, setOpen] = useState(true);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showSubForm, setShowSubForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [editingSub, setEditingSub] = useState(null);
  const [detailTask, setDetailTask] = useState(null);
  const qc = useQueryClient();

  const children = allSubProjects.filter((s) => s.parent_id === subProject.id);
  const myTasks = tasks.filter((t) => t.sub_project_id === subProject.id);
  const approved = myTasks.filter((t) => t.status === "approved").length;
  const percent = myTasks.length ? Math.round((approved / myTasks.length) * 100) : 0;

  // Determine label: root level = Serviço, deeper = Subserviço
  const levelLabel = depth === 0 ? "Subserviço" : "Subserviço";

  const handleStatusChange = async (task, newStatus) => {
    await base44.entities.Task.update(task.id, { status: newStatus });
    qc.invalidateQueries(["tasks"]);
  };

  const handleDeleteTask = async (task) => {
    if (!isAdmin) return;
    await base44.entities.Task.delete(task.id);
    qc.invalidateQueries(["tasks"]);
  };

  const handleDeleteChild = async (sub) => {
    if (!isAdmin) return;
    if (!confirm(`Excluir "${sub.name}"? As tarefas e subpastas também serão excluídas.`)) return;
    await deleteFolderRecursive(sub, allSubProjects, tasks);
    qc.invalidateQueries(["subprojects"]);
    qc.invalidateQueries(["tasks"]);
  };

  return (
    <div className="border-l-2 border-gray-100 pl-2">
      <div className="flex items-center gap-1.5 py-1.5 px-2 rounded-lg hover:bg-gray-50 group cursor-pointer" onClick={() => setOpen(!open)}>
        {open ? <ChevronDown className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />}
        {open ? <FolderOpen className="w-4 h-4 text-amber-400 flex-shrink-0" /> : <Folder className="w-4 h-4 text-amber-400 flex-shrink-0" />}
        <span className="text-sm font-medium text-gray-800 flex-1">{subProject.name}</span>

        {myTasks.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <div className="w-16 bg-gray-200 rounded-full h-1">
              <div className="bg-green-400 h-1 rounded-full" style={{ width: `${percent}%` }} />
            </div>
            <span>{percent}%</span>
          </div>
        )}

        {isAdmin && (
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-1" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => { setShowSubForm(true); setEditingSub(null); }} className="p-1 text-gray-400 hover:text-blue-600 rounded text-xs flex items-center gap-0.5" title={`Novo ${levelLabel}`}>
              <Folder className="w-3 h-3" /><Plus className="w-2.5 h-2.5" />
            </button>
            <button onClick={() => { setShowTaskForm(true); setEditingTask(null); }} className="p-1 text-gray-400 hover:text-blue-600 rounded" title="Nova tarefa">
              <Plus className="w-3 h-3" />
            </button>
            <button onClick={() => onEditSub(subProject)} className="p-1 text-gray-400 hover:text-gray-700 rounded"><Pencil className="w-3 h-3" /></button>
            <button onClick={() => onDeleteSub(subProject)} className="p-1 text-gray-400 hover:text-red-500 rounded"><Trash2 className="w-3 h-3" /></button>
          </div>
        )}
      </div>

      {open && (
        <div className="space-y-0.5 ml-4">
          {showSubForm && !editingSub && (
            <SubProjectForm clientId={clientId} parentId={subProject.id} onClose={() => setShowSubForm(false)} />
          )}
          {children.map((child) =>
            editingSub?.id === child.id ? (
              <SubProjectForm key={child.id} clientId={clientId} parentId={subProject.id} subProject={child} onClose={() => setEditingSub(null)} />
            ) : (
              <SubProjectNode
                key={child.id}
                subProject={child}
                allSubProjects={allSubProjects}
                tasks={tasks}
                clientId={clientId}
                depth={depth + 1}
                onDeleteSub={handleDeleteChild}
                onEditSub={(s) => { setEditingSub(s); setShowSubForm(false); }}
                isAdmin={isAdmin}
              />
            )
          )}
          {showTaskForm && (
            <TaskForm clientId={clientId} subProjectId={subProject.id} onClose={() => setShowTaskForm(false)} />
          )}
          {myTasks.map((task) =>
            editingTask?.id === task.id ? (
              <TaskForm key={task.id} clientId={clientId} subProjectId={subProject.id} task={task} onClose={() => setEditingTask(null)} />
            ) : (
              <TaskRow
                key={task.id}
                task={task}
                onStatusChange={handleStatusChange}
                onEdit={(t) => { setEditingTask(t); setShowTaskForm(false); }}
                onDelete={handleDeleteTask}
                onOpenDetail={(t) => setDetailTask(t)}
                isAdmin={isAdmin}
              />
            )
          )}
          {children.length === 0 && myTasks.length === 0 && !showTaskForm && !showSubForm && (
            <p className="text-xs text-gray-400 py-1 italic">Pasta vazia</p>
          )}
        </div>
      )}

      <TaskDetailModal task={detailTask} open={!!detailTask} onClose={() => setDetailTask(null)} isAdmin={isAdmin} />
    </div>
  );
}

async function deleteFolderRecursive(sub, allSubProjects, tasks) {
  const children = allSubProjects.filter((s) => s.parent_id === sub.id);
  await Promise.all(children.map((c) => deleteFolderRecursive(c, allSubProjects, tasks)));
  const subTasks = tasks.filter((t) => t.sub_project_id === sub.id);
  await Promise.all(subTasks.map((t) => base44.entities.Task.delete(t.id)));
  await base44.entities.SubProject.delete(sub.id);
}

// ─── Main FolderView ───
export default function FolderView({ client, subProjects, tasks, onBack, isAdmin }) {
  const [open, setOpen] = useState(true);
  const [showSubForm, setShowSubForm] = useState(false);
  const [editingSub, setEditingSub] = useState(null);
  const qc = useQueryClient();

  const clientSubProjects = subProjects.filter((s) => s.client_id === client.id);
  const rootSubProjects = clientSubProjects.filter((s) => !s.parent_id);
  const clientTasks = tasks.filter((t) => t.client_id === client.id);
  const approved = clientTasks.filter((t) => t.status === "approved").length;
  const percent = clientTasks.length ? Math.round((approved / clientTasks.length) * 100) : 0;

  const handleDeleteSub = async (sub) => {
    if (!isAdmin) return;
    if (!confirm(`Excluir "${sub.name}"? As tarefas e subpastas também serão excluídas.`)) return;
    await deleteFolderRecursive(sub, clientSubProjects, tasks);
    qc.invalidateQueries(["subprojects"]);
    qc.invalidateQueries(["tasks"]);
  };

  return (
    <div className="max-w-3xl mx-auto">
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-5 transition-colors">
        <ChevronLeft className="w-4 h-4" /> Voltar para projetos
      </button>

      {!isAdmin && (
        <div className="flex items-center gap-2 mb-4 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 text-sm text-amber-700">
          <ShieldAlert className="w-4 h-4 flex-shrink-0" />
          Você está no modo visualização. Apenas administradores podem aprovar/reprovar tarefas e editar o projeto.
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: client.color || "#3B82F6" }} />
            <h2 className="text-xl font-bold text-gray-900">{client.name}</h2>
          </div>
          {client.description && <p className="text-sm text-gray-500 mb-3">{client.description}</p>}
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-gray-100 rounded-full h-2">
              <div className="bg-green-500 h-2 rounded-full transition-all" style={{ width: `${percent}%` }} />
            </div>
            <span className="text-sm font-semibold text-gray-700">{percent}%</span>
          </div>
          <div className="flex gap-4 mt-2 text-xs text-gray-500">
            <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> {approved} aprovadas</span>
            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-yellow-500" /> {clientTasks.filter(t => t.status === "under_review").length} em análise</span>
            <span className="flex items-center gap-1"><XCircle className="w-3.5 h-3.5 text-red-400" /> {clientTasks.filter(t => t.status === "rejected").length} reprovadas</span>
          </div>
        </div>

        {/* Tree: Obra > Serviço > Subserviço > Tarefa */}
        <div className="p-4">
          <div className="flex items-center gap-1.5 py-1.5 px-2 rounded-lg hover:bg-gray-50 cursor-pointer group" onClick={() => setOpen(!open)}>
            {open ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
            {open
              ? <FolderOpen className="w-5 h-5 flex-shrink-0" style={{ color: client.color || "#3B82F6" }} />
              : <Folder className="w-5 h-5 flex-shrink-0" style={{ color: client.color || "#3B82F6" }} />
            }
            <span className="text-base font-semibold text-gray-900 flex-1">{client.name}</span>
            {isAdmin && (
              <button
                onClick={(e) => { e.stopPropagation(); setShowSubForm(true); setEditingSub(null); }}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity px-2 py-1 rounded border border-transparent hover:border-blue-200 hover:bg-blue-50"
              >
                <Plus className="w-3.5 h-3.5" /> Novo Serviço
              </button>
            )}
          </div>

          {open && (
            <div className="space-y-1 mt-1 ml-4">
              {showSubForm && !editingSub && (
                <SubProjectForm clientId={client.id} parentId={null} onClose={() => setShowSubForm(false)} />
              )}
              {rootSubProjects.length === 0 && !showSubForm && (
                <p className="text-xs text-gray-400 py-2 italic">
                  {isAdmin ? 'Nenhum serviço criado — clique em "+ Novo Serviço"' : "Nenhum serviço criado ainda."}
                </p>
              )}
              {rootSubProjects.map((sub) =>
                editingSub?.id === sub.id ? (
                  <SubProjectForm key={sub.id} clientId={client.id} parentId={null} subProject={sub} onClose={() => setEditingSub(null)} />
                ) : (
                  <SubProjectNode
                    key={sub.id}
                    subProject={sub}
                    allSubProjects={clientSubProjects}
                    tasks={tasks}
                    clientId={client.id}
                    depth={0}
                    onDeleteSub={handleDeleteSub}
                    onEditSub={(s) => { setEditingSub(s); setShowSubForm(false); }}
                    isAdmin={isAdmin}
                  />
                )
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}