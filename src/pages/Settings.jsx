import { useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ImagePlus, X, Save, CheckCircle2 } from "lucide-react";

const COLORS = ["#3B82F6", "#8B5CF6", "#10B981", "#F59E0B", "#EF4444", "#EC4899", "#14B8A6", "#F97316"];

const DEFAULT_SETTINGS = {
  app_name: "ProjectFlow",
  app_description: "Gestão de Projetos",
  logo_url: "",
  primary_color: "#3B82F6",
};

export default function Settings() {
  const [form, setForm] = useState(DEFAULT_SETTINGS);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();
  const qc = useQueryClient();

  const { data: settingsList = [] } = useQuery({
    queryKey: ["app_settings"],
    queryFn: () => base44.entities.AppSettings.list(),
  });

  const settings = settingsList[0] || null;

  useEffect(() => {
    if (settings) {
      setForm({
        app_name: settings.app_name || DEFAULT_SETTINGS.app_name,
        app_description: settings.app_description || DEFAULT_SETTINGS.app_description,
        logo_url: settings.logo_url || "",
        primary_color: settings.primary_color || DEFAULT_SETTINGS.primary_color,
      });
    }
  }, [settings]);

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm((f) => ({ ...f, logo_url: file_url }));
    setUploading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    if (settings) {
      await base44.entities.AppSettings.update(settings.id, form);
    } else {
      await base44.entities.AppSettings.create(form);
    }
    qc.invalidateQueries(["app_settings"]);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
        <p className="text-gray-500 text-sm mt-1">Personalize as informações gerais do aplicativo</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">

        {/* Logo */}
        <div>
          <Label className="text-sm font-medium text-gray-700">Logotipo</Label>
          <div className="mt-2 flex items-center gap-4">
            <div
              className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden cursor-pointer hover:border-blue-400 transition-colors flex-shrink-0"
              style={{ backgroundColor: form.logo_url ? "transparent" : form.primary_color + "15" }}
              onClick={() => fileRef.current.click()}
            >
              {form.logo_url ? (
                <img src={form.logo_url} alt="logo" className="w-full h-full object-cover" />
              ) : (
                <ImagePlus className="w-7 h-7 text-gray-400" />
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current.click()} disabled={uploading}>
                {uploading ? "Enviando..." : "Escolher imagem"}
              </Button>
              {form.logo_url && (
                <button type="button" onClick={() => setForm((f) => ({ ...f, logo_url: "" }))} className="text-xs text-red-500 hover:underline flex items-center gap-1">
                  <X className="w-3 h-3" /> Remover
                </button>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
          </div>
        </div>

        {/* App Name */}
        <div>
          <Label htmlFor="app_name" className="text-sm font-medium text-gray-700">Nome do aplicativo</Label>
          <Input
            id="app_name"
            className="mt-1"
            value={form.app_name}
            onChange={(e) => setForm({ ...form, app_name: e.target.value })}
            placeholder="Ex: ProjectFlow"
          />
        </div>

        {/* App Description */}
        <div>
          <Label htmlFor="app_desc" className="text-sm font-medium text-gray-700">Subtítulo / Descrição</Label>
          <Textarea
            id="app_desc"
            className="mt-1"
            value={form.app_description}
            onChange={(e) => setForm({ ...form, app_description: e.target.value })}
            placeholder="Ex: Gestão de Projetos"
            rows={2}
          />
        </div>

        {/* Primary Color */}
        <div>
          <Label className="text-sm font-medium text-gray-700">Cor principal</Label>
          <div className="flex gap-2 mt-2 flex-wrap">
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setForm({ ...form, primary_color: c })}
                className="w-8 h-8 rounded-full border-2 transition-all"
                style={{ backgroundColor: c, borderColor: form.primary_color === c ? "#1F2937" : "transparent", transform: form.primary_color === c ? "scale(1.15)" : "scale(1)" }}
              />
            ))}
          </div>
        </div>

        {/* Save */}
        <div className="pt-2 border-t border-gray-100 flex items-center justify-end gap-3">
          {saved && (
            <span className="flex items-center gap-1 text-sm text-green-600">
              <CheckCircle2 className="w-4 h-4" /> Salvo com sucesso!
            </span>
          )}
          <Button onClick={handleSave} disabled={saving} className="flex items-center gap-2">
            <Save className="w-4 h-4" />
            {saving ? "Salvando..." : "Salvar alterações"}
          </Button>
        </div>
      </div>
    </div>
  );
}