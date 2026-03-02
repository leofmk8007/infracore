import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from "@/api/base44Client";
import { ImagePlus, X } from "lucide-react";

const COLORS = ["#3B82F6", "#8B5CF6", "#10B981", "#F59E0B", "#EF4444", "#EC4899", "#14B8A6", "#F97316"];

const DEFAULT_STATUSES = [
  { id: "active", label: "Ativo" },
  { id: "completed", label: "Concluído" },
  { id: "on_hold", label: "Em espera" },
];

export default function ClientFormModal({ open, onClose, onSave, client }) {
  const [form, setForm] = useState({ name: "", description: "", status: "active", color: "#3B82F6", icon_url: "" });
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();

  const { data: settingsList = [] } = useQuery({
    queryKey: ["app_settings"],
    queryFn: () => base44.entities.AppSettings.list(),
  });

  const settings = settingsList[0];
  const projectStatuses = settings?.project_statuses || DEFAULT_STATUSES;

  useEffect(() => {
    if (client) {
      setForm({ name: client.name || "", description: client.description || "", status: client.status || "active", color: client.color || "#3B82F6", icon_url: client.icon_url || "" });
    } else {
      setForm({ name: "", description: "", status: "active", color: "#3B82F6", icon_url: "" });
    }
  }, [client, open]);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm((f) => ({ ...f, icon_url: file_url }));
    setUploading(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    onSave(form);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{client ? "Editar Projeto" : "Novo Projeto"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {/* Icon Upload */}
          <div>
            <Label>Ícone do projeto</Label>
            <div className="mt-2 flex items-center gap-3">
              <div
                className="w-16 h-16 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0 cursor-pointer hover:border-blue-400 transition-colors"
                style={{ backgroundColor: form.icon_url ? "transparent" : (form.color + "20") }}
                onClick={() => fileRef.current.click()}
              >
                {form.icon_url ? (
                  <img src={form.icon_url} alt="ícone" className="w-full h-full object-cover" />
                ) : (
                  <ImagePlus className="w-6 h-6 text-gray-400" />
                )}
              </div>
              <div className="flex flex-col gap-1">
                <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current.click()} disabled={uploading}>
                  {uploading ? "Enviando..." : "Escolher imagem"}
                </Button>
                {form.icon_url && (
                  <button type="button" onClick={() => setForm((f) => ({ ...f, icon_url: "" }))} className="text-xs text-red-500 hover:underline flex items-center gap-1">
                    <X className="w-3 h-3" /> Remover
                  </button>
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            </div>
          </div>

          <div>
            <Label htmlFor="name">Nome do projeto *</Label>
            <Input
              id="name"
              className="mt-1"
              placeholder="Ex: Empresa ABC"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              className="mt-1"
              placeholder="Descreva o projeto..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
            />
          </div>
          <div>
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {projectStatuses.map((status) => (
                  <SelectItem key={status.id} value={status.id}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Cor de identificação</Label>
            <div className="flex gap-2 mt-2 flex-wrap">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setForm({ ...form, color: c })}
                  className="w-7 h-7 rounded-full border-2 transition-all"
                  style={{ backgroundColor: c, borderColor: form.color === c ? "#1F2937" : "transparent" }}
                />
              ))}
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">Cancelar</Button>
            <Button type="submit" className="flex-1">{client ? "Salvar" : "Criar Projeto"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}