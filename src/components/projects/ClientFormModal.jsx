import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const COLORS = ["#3B82F6", "#8B5CF6", "#10B981", "#F59E0B", "#EF4444", "#EC4899", "#14B8A6", "#F97316"];

export default function ClientFormModal({ open, onClose, onSave, client }) {
  const [form, setForm] = useState({ name: "", description: "", status: "active", color: "#3B82F6" });

  useEffect(() => {
    if (client) {
      setForm({ name: client.name || "", description: client.description || "", status: client.status || "active", color: client.color || "#3B82F6" });
    } else {
      setForm({ name: "", description: "", status: "active", color: "#3B82F6" });
    }
  }, [client, open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    onSave(form);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{client ? "Editar Obra" : "Nova Obra"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div>
            <Label htmlFor="name">Nome da obra *</Label>
            <Input
              id="name"
              className="mt-1"
              placeholder="Ex: Obra Centro Comercial"
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
              placeholder="Descreva a obra..."
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
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="completed">Concluído</SelectItem>
                <SelectItem value="on_hold">Em espera</SelectItem>
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
            <Button type="submit" className="flex-1">{client ? "Salvar" : "Criar Obra"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}