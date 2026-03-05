import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { CheckCircle2, XCircle, Clock, Plus, Pencil, Trash2, ChevronLeft, X, Paperclip, FileText, Image, ExternalLink } from "lucide-react";
import TaskDetailModal from "./TaskDetailModal";
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

function TaskRow({ task, onStatusChange, onDelete, onEdit, onView, taskStatuses, taskFields = [] }) {
  const statusConfig = taskStatuses.find(s => s.id === task.status);
  const label = statusConfig?.label || "Desconhecido";
  const color = statusConfig?.color || "#6B7280";
  const Icon = STATUS_ICON[task.status] || Clock;

  const statusIds = taskStatuses.map(s => s.id);
  const currentIdx = statusIds.indexOf(task.status);
  const nextStatus = statusIds[(currentIdx + 1) % statusIds.length];

  return (
    <div className="flex items-start gap-3 py-3 px-4 hover:bg-gray-50 rounded-lg group transition-colors cursor-pointer" onClick={() => onView(task)}>
      <button
        onClick={(e) => { e.stopPropagation(); onStatusChange(task, nextStatus); }}
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
        {/* Campos customizados visíveis */}
        {taskFields.length > 0 && task.custom_fields && (
          <div className="flex gap-2 mt-1.5 flex-wrap">
            {taskFields.map(field => {
              const value = task.custom_fields[field.id];
              if (!value) return null;
              
              let displayValue = value;
              if (field.type === "select") {
                displayValue = field.options?.find(o => o.id === value)?.label || value;
              }
              
              return (
                <span key={field.id} className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600 border border-gray-200">
                  <span className="font-medium">{field.label}:</span> {displayValue}
                </span>
              );
            })}
          </div>
        )}
        {/* Anexos */}
        {task.attachments?.length > 0 && (
          <div className="flex gap-1.5 mt-1.5 flex-wrap">
            {task.attachments.map((att, idx) => {
              const isImg = att.type?.startsWith("image/") || /\.(jpg|jpeg|png|gif|webp)$/i.test(att.name);
              return (
                <a key={idx} href={att.url} target="_blank" rel="noreferrer"
                  className="flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-100 transition-colors"
                >
                  {isImg ? <Image className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
                  <span className="max-w-[100px] truncate">{att.name}</span>
                  <ExternalLink className="w-2.5 h-2.5 opacity-50" />
                </a>
              );
            })}
          </div>
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

function AttachmentsField({ attachments = [], onChange }) {
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    const uploaded = [];
    for (const file of files) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      uploaded.push({ name: file.name, url: file_url, type: file.type });
    }
    onChange([...attachments, ...uploaded]);
    setUploading(false);
    e.target.value = "";
  };

  const remove = (idx) => onChange(attachments.filter((_, i) => i !== idx));

  const isImage = (att) => att.type?.startsWith("image/") || /\.(jpg|jpeg|png|gif|webp)$/i.test(att.name);

  return (
    <div>
      <label className="text-xs font-medium text-gray-700 flex items-center gap-1">
        <Paperclip className="w-3.5 h-3.5" /> Anexos
      </label>
      <div className="mt-1 space-y-2">
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {attachments.map((att, idx) => (
              <div key={idx} className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-xs group">
                {isImage(att) ? <Image className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" /> : <FileText className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />}
                <a href={att.url} target="_blank" rel="noreferrer" className="max-w-[120px] truncate text-gray-700 hover:text-blue-600 hover:underline">
                  {att.name}
                </a>
                <button type="button" onClick={() => remove(idx)} className="text-gray-300 hover:text-red-500 ml-0.5">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
        <label className={`flex items-center gap-2 px-3 py-2 border border-dashed border-blue-200 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors text-xs text-blue-600 ${uploading ? "opacity-60 pointer-events-none" : ""}`}>
          <Paperclip className="w-3.5 h-3.5" />
          {uploading ? "Enviando..." : "Clique para anexar documentos ou fotos"}
          <input type="file" multiple accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt" className="hidden" onChange={handleFileChange} disabled={uploading} />
        </label>
      </div>
    </div>
  );
}

function TaskForm({ clientId, task, onClose, taskStatuses, taskFields = [] }) {
  const [form, setForm] = useState({ 
    title: task?.title || "", 
    description: task?.description || "", 
    status: task?.status || (taskStatuses[0]?.id || "under_review"),
    custom_fields: task?.custom_fields || {},
    attachments: task?.attachments || []
  });
  const qc = useQueryClient();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    if (task) {
      await base44.entities.Task.update(task.id, { title: form.title, description: form.description, status: form.status, custom_fields: form.custom_fields, attachments: form.attachments });
    } else {
      await base44.entities.Task.create({ title: form.title, description: form.description, client_id: clientId, status: form.status, custom_fields: form.custom_fields, attachments: form.attachments });
    }
    qc.invalidateQueries(["tasks"]);
    onClose();
  };

  const handleCustomFieldChange = (fieldId, value) => {
    setForm(prev => ({
      ...prev,
      custom_fields: { ...prev.custom_fields, [fieldId]: value }
    }));
  };

  const renderCustomField = (field) => {
    const value = form.custom_fields[field.id] || "";
    
    if (field.type === "date") {
      return (
        <div key={field.id}>
          <label className="text-xs font-medium text-gray-700">{field.label}</label>
          <Input
            type="date"
            value={value}
            onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
            required={field.required}
            className="mt-1 bg-white"
          />
        </div>
      );
    }
    
    if (field.type === "select") {
      return (
        <div key={field.id}>
          <label className="text-xs font-medium text-gray-700">{field.label}</label>
          <Select value={value} onValueChange={(v) => handleCustomFieldChange(field.id, v)}>
            <SelectTrigger className="mt-1 bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map(opt => (
                <SelectItem key={opt.id} value={opt.id}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );
    }
    
    if (field.type === "number") {
      return (
        <div key={field.id}>
          <label className="text-xs font-medium text-gray-700">{field.label}</label>
          <Input
            type="number"
            value={value}
            onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
            required={field.required}
            className="mt-1 bg-white"
          />
        </div>
      );
    }

    if (field.type === "file") {
      return (
        <div key={field.id}>
          <label className="text-xs font-medium text-gray-700">{field.label}</label>
          <Input
            type="file"
            onChange={(e) => handleCustomFieldChange(field.id, e.target.files[0]?.name || "")}
            required={field.required}
            className="mt-1 bg-white"
          />
        </div>
      );
    }

    return (
      <div key={field.id}>
        <label className="text-xs font-medium text-gray-700">{field.label}</label>
        <Input
          type="text"
          placeholder={field.label}
          value={value}
          onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
          required={field.required}
          className="mt-1 bg-white"
        />
      </div>
    );
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

      {/* Campos Customizados */}
      {taskFields.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-blue-200">
          {taskFields.map(field => renderCustomField(field))}
        </div>
      )}

      {/* Anexos */}
      <div className="pt-2 border-t border-blue-200">
        <AttachmentsField
          attachments={form.attachments}
          onChange={(attachments) => setForm(prev => ({ ...prev, attachments }))}
        />
      </div>

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
  const taskFields = taskCustom?.fields || [];

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
             <div className="h-2 rounded-full transition-all" style={{ backgroundColor: taskStatuses[0]?.color || "#10B981", width: `${percent}%` }} />
           </div>
           <span className="text-sm font-semibold text-gray-700">{percent}%</span>
          </div>
          <div className="flex gap-4 mt-3 text-xs text-gray-500 flex-wrap">
           {taskStatuses.map(status => {
             const count = clientTasks.filter(t => t.status === status.id).length;
             const Icon = STATUS_ICON[status.id] || Clock;
             return (
               <span key={status.id} className="flex items-center gap-1">
                 <Icon className="w-3.5 h-3.5" style={{ color: status.color }} /> {count} {status.label.toLowerCase()}
               </span>
             );
           })}
          </div>
        </div>

        {/* Filter + Add */}
        <div className="px-4 pt-4 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex gap-1 text-xs flex-wrap">
            <button
              onClick={() => setFilter("all")}
              className={`px-3 py-1 rounded-full border font-medium transition-colors ${filter === "all" ? "bg-gray-900 text-white border-gray-900" : "text-gray-600 border-gray-200 hover:bg-gray-50"}`}
            >
              Todas
            </button>
            {taskStatuses.map(status => (
              <button
                key={status.id}
                onClick={() => setFilter(status.id)}
                className={`px-3 py-1 rounded-full border font-medium transition-colors ${filter === status.id ? "bg-gray-900 text-white border-gray-900" : "text-gray-600 border-gray-200 hover:bg-gray-50"}`}
              >
                {status.label}
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
            <TaskForm clientId={client.id} onClose={() => setShowForm(false)} taskStatuses={taskStatuses} taskFields={taskFields} />
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
                  <TaskForm clientId={client.id} task={task} onClose={() => setEditingTask(null)} taskStatuses={taskStatuses} taskFields={taskFields} />
                </div>
              ) : (
                <TaskRow
                  key={task.id}
                  task={task}
                  onStatusChange={handleStatusChange}
                  onDelete={handleDelete}
                  onEdit={(t) => { setEditingTask(t); setShowForm(false); }}
                  taskStatuses={taskStatuses}
                  taskFields={taskFields}
                />
              )
            )
          )}
        </div>
      </div>
    </div>
  );
}