import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CheckCircle2, XCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";

const STATUS_CONFIG = {
  under_review: { label: "Em análise", icon: Clock, badge: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  approved: { label: "Aprovada", icon: CheckCircle2, badge: "bg-green-100 text-green-700 border-green-200" },
  rejected: { label: "Reprovada", icon: XCircle, badge: "bg-red-100 text-red-700 border-red-200" },
};

export default function TaskDetailModal({ task, open, onClose, isAdmin }) {
  const qc = useQueryClient();

  if (!task) return null;

  const cfg = STATUS_CONFIG[task.status] || STATUS_CONFIG.under_review;
  const Icon = cfg.icon;

  const handleStatusChange = async (newStatus) => {
    await base44.entities.Task.update(task.id, { status: newStatus });
    qc.invalidateQueries(["tasks"]);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold text-gray-900">{task.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Status:</span>
            <span className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full border font-medium ${cfg.badge}`}>
              <Icon className="w-3.5 h-3.5" /> {cfg.label}
            </span>
          </div>

          {task.description && (
            <div>
              <p className="text-sm text-gray-500 mb-1">Descrição:</p>
              <p className="text-sm text-gray-700">{task.description}</p>
            </div>
          )}

          {isAdmin && (
            <div className="pt-2 border-t border-gray-100">
              <p className="text-xs text-gray-400 mb-2">Alterar status:</p>
              <div className="flex gap-2 flex-wrap">
                <Button
                  size="sm"
                  variant={task.status === "under_review" ? "default" : "outline"}
                  className="text-xs h-7"
                  onClick={() => handleStatusChange("under_review")}
                >
                  <Clock className="w-3 h-3 mr-1" /> Em análise
                </Button>
                <Button
                  size="sm"
                  variant={task.status === "approved" ? "default" : "outline"}
                  className="text-xs h-7"
                  onClick={() => handleStatusChange("approved")}
                >
                  <CheckCircle2 className="w-3 h-3 mr-1" /> Aprovar
                </Button>
                <Button
                  size="sm"
                  variant={task.status === "rejected" ? "default" : "outline"}
                  className="text-xs h-7"
                  onClick={() => handleStatusChange("rejected")}
                >
                  <XCircle className="w-3 h-3 mr-1" /> Reprovar
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}