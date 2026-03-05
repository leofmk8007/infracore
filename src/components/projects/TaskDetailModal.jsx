import { FileText, Image, ExternalLink, X, CheckCircle2, XCircle, Clock, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import TaskComments from "./TaskComments";

const STATUS_ICON = {
  under_review: Clock,
  approved: CheckCircle2,
  rejected: XCircle,
};

export default function TaskDetailModal({ task, taskStatuses, taskFields = [], onClose, onEdit }) {
  const statusConfig = taskStatuses.find(s => s.id === task.status);
  const label = statusConfig?.label || "Desconhecido";
  const color = statusConfig?.color || "#6B7280";
  const Icon = STATUS_ICON[task.status] || Clock;

  const isImage = (att) => att.type?.startsWith("image/") || /\.(jpg|jpeg|png|gif|webp)$/i.test(att.name);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-gray-100">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color }} />
            <div className="flex-1 min-w-0">
              <h2 className={`text-base font-semibold ${task.status === "rejected" ? "line-through text-gray-400" : "text-gray-900"}`}>
                {task.title}
              </h2>
              <span className="inline-flex items-center mt-1 text-xs px-2 py-0.5 rounded-full border font-medium" style={{ backgroundColor: color + "20", color, borderColor: color }}>
                {label}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1 ml-3 flex-shrink-0">
            <Button variant="outline" size="sm" onClick={onEdit} className="flex items-center gap-1.5 text-xs h-8">
              <Pencil className="w-3.5 h-3.5" /> Editar
            </Button>
            <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Descrição */}
          {task.description ? (
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Descrição</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{task.description}</p>
            </div>
          ) : (
            <p className="text-sm text-gray-400 italic">Sem descrição</p>
          )}

          {/* Campos Customizados */}
          {taskFields.length > 0 && task.custom_fields && (
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Campos</p>
              <div className="grid grid-cols-2 gap-2">
                {taskFields.map(field => {
                  const value = task.custom_fields[field.id];
                  if (!value) return null;

                  let displayValue = value;
                  if (field.type === "select") {
                    displayValue = field.options?.find(o => o.id === value)?.label || value;
                  }

                  return (
                    <div key={field.id} className="bg-gray-50 rounded-lg px-3 py-2">
                      <p className="text-xs text-gray-500 font-medium">{field.label}</p>
                      <p className="text-sm text-gray-800 mt-0.5">{displayValue}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Anexos */}
          {task.attachments?.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Anexos ({task.attachments.length})</p>
              <div className="space-y-2">
                {task.attachments.map((att, idx) => {
                  const isImg = isImage(att);
                  return (
                    <div key={idx}>
                      {isImg ? (
                        <a href={att.url} target="_blank" rel="noreferrer" className="block rounded-lg overflow-hidden border border-gray-200 hover:border-blue-300 transition-colors">
                          <img src={att.url} alt={att.name} className="w-full max-h-48 object-cover" />
                          <div className="flex items-center gap-1.5 px-3 py-2 text-xs text-gray-500 bg-gray-50">
                            <Image className="w-3.5 h-3.5" />
                            <span className="truncate flex-1">{att.name}</span>
                            <ExternalLink className="w-3 h-3 opacity-50" />
                          </div>
                        </a>
                      ) : (
                        <a href={att.url} target="_blank" rel="noreferrer"
                          className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
                        >
                          <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <span className="text-sm text-gray-700 flex-1 truncate">{att.name}</span>
                          <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Comentários */}
          <div className="border-t border-gray-100 pt-4">
            <TaskComments taskId={task.id} />
          </div>
        </div>
      </div>
    </div>
  );
}