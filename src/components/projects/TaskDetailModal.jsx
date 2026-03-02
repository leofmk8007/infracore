import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Upload, FileText, X, Loader2 } from "lucide-react";

export default function TaskDetailModal({ task, open, onClose }) {
  const qc = useQueryClient();
  const fileInputRef = useRef({});
  const [newSubTaskTitle, setNewSubTaskTitle] = useState("");
  const [uploadingFor, setUploadingFor] = useState(null);

  const { data: subTasks = [], isLoading } = useQuery({
    queryKey: ["subtasks", task?.id],
    queryFn: () => base44.entities.SubTask.filter({ task_id: task.id }),
    enabled: !!task?.id && open,
  });

  const handleAddSubTask = async (e) => {
    e.preventDefault();
    if (!newSubTaskTitle.trim()) return;
    await base44.entities.SubTask.create({ task_id: task.id, title: newSubTaskTitle.trim(), completed: false, documents: [] });
    setNewSubTaskTitle("");
    qc.invalidateQueries(["subtasks", task.id]);
  };

  const handleToggle = async (subTask) => {
    await base44.entities.SubTask.update(subTask.id, { completed: !subTask.completed });
    qc.invalidateQueries(["subtasks", task.id]);
  };

  const handleDeleteSubTask = async (subTask) => {
    await base44.entities.SubTask.delete(subTask.id);
    qc.invalidateQueries(["subtasks", task.id]);
  };

  const handleUploadDoc = async (subTask, file) => {
    setUploadingFor(subTask.id);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    const updatedDocs = [...(subTask.documents || []), { name: file.name, url: file_url }];
    await base44.entities.SubTask.update(subTask.id, { documents: updatedDocs });
    qc.invalidateQueries(["subtasks", task.id]);
    setUploadingFor(null);
  };

  const handleRemoveDoc = async (subTask, docIndex) => {
    const updatedDocs = (subTask.documents || []).filter((_, i) => i !== docIndex);
    await base44.entities.SubTask.update(subTask.id, { documents: updatedDocs });
    qc.invalidateQueries(["subtasks", task.id]);
  };

  const completedCount = subTasks.filter((s) => s.completed).length;
  const percent = subTasks.length ? Math.round((completedCount / subTasks.length) * 100) : 0;

  if (!task) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold text-gray-900">{task.title}</DialogTitle>
        </DialogHeader>

        {task.description && (
          <p className="text-sm text-gray-500 -mt-2">{task.description}</p>
        )}

        {/* Progress */}
        {subTasks.length > 0 && (
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-gray-100 rounded-full h-1.5">
              <div className="bg-green-500 h-1.5 rounded-full transition-all" style={{ width: `${percent}%` }} />
            </div>
            <span className="text-xs text-gray-500">{completedCount}/{subTasks.length}</span>
          </div>
        )}

        {/* Sub-tasks */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Subtarefas</h3>

          {isLoading ? (
            <div className="flex items-center gap-2 text-gray-400 text-sm py-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Carregando...
            </div>
          ) : (
            <div className="space-y-3">
              {subTasks.map((subTask) => (
                <div key={subTask.id} className="border border-gray-100 rounded-lg p-3 bg-gray-50 space-y-2">
                  {/* SubTask header */}
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id={`st-${subTask.id}`}
                      checked={subTask.completed}
                      onCheckedChange={() => handleToggle(subTask)}
                    />
                    <Label
                      htmlFor={`st-${subTask.id}`}
                      className={`flex-1 text-sm cursor-pointer ${subTask.completed ? "line-through text-gray-400" : "text-gray-800"}`}
                    >
                      {subTask.title}
                    </Label>
                    <button
                      onClick={() => handleDeleteSubTask(subTask)}
                      className="p-1 text-gray-300 hover:text-red-400 rounded transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Documents */}
                  <div className="pl-6 space-y-1">
                    {(subTask.documents || []).map((doc, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 text-xs text-blue-600 group">
                        <FileText className="w-3 h-3 flex-shrink-0" />
                        <a href={doc.url} target="_blank" rel="noreferrer" className="flex-1 truncate hover:underline">
                          {doc.name}
                        </a>
                        <button
                          onClick={() => handleRemoveDoc(subTask, idx)}
                          className="text-gray-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}

                    {/* Upload button */}
                    <input
                      type="file"
                      ref={(el) => (fileInputRef.current[subTask.id] = el)}
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleUploadDoc(subTask, file);
                        e.target.value = "";
                      }}
                    />
                    <button
                      onClick={() => fileInputRef.current[subTask.id]?.click()}
                      disabled={uploadingFor === subTask.id}
                      className="flex items-center gap-1 text-xs text-gray-400 hover:text-blue-600 transition-colors"
                    >
                      {uploadingFor === subTask.id ? (
                        <><Loader2 className="w-3 h-3 animate-spin" /> Enviando...</>
                      ) : (
                        <><Upload className="w-3 h-3" /> Anexar documento</>
                      )}
                    </button>
                  </div>
                </div>
              ))}

              {subTasks.length === 0 && (
                <p className="text-xs text-gray-400 italic">Nenhuma subtarefa ainda.</p>
              )}
            </div>
          )}

          {/* Add subtask form */}
          <form onSubmit={handleAddSubTask} className="flex items-center gap-2 mt-3">
            <Input
              placeholder="Nova subtarefa..."
              value={newSubTaskTitle}
              onChange={(e) => setNewSubTaskTitle(e.target.value)}
              className="h-8 text-sm"
            />
            <Button type="submit" size="sm" className="h-8 px-3 flex items-center gap-1 text-xs">
              <Plus className="w-3.5 h-3.5" /> Adicionar
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}