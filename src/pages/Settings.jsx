import { useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ImagePlus, X, Save, CheckCircle2, Plus, Trash2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const COLORS = ["#3B82F6", "#8B5CF6", "#10B981", "#F59E0B", "#EF4444", "#EC4899", "#14B8A6", "#F97316"];

const DEFAULT_SETTINGS = {
  app_name: "ProjectFlow",
  app_description: "Gestão de Projetos",
  logo_url: "",
  primary_color: "#3B82F6",
  nav_items: [
    { name: "Dashboard", page: "Dashboard" },
    { name: "Projetos", page: "Projects" },
    { name: "Configurações", page: "Settings" },
  ],
  project_statuses: [
    { id: "active", label: "Ativo", color: "#10B981" },
    { id: "completed", label: "Concluído", color: "#3B82F6" },
    { id: "on_hold", label: "Em espera", color: "#F59E0B" },
  ],
  task_statuses: [
    { id: "under_review", label: "Em análise", color: "#F59E0B" },
    { id: "approved", label: "Aprovado", color: "#10B981" },
    { id: "rejected", label: "Rejeitado", color: "#EF4444" },
  ],
  task_fields: [],
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

  const { data: projectCustomList = [] } = useQuery({
    queryKey: ["project_customization"],
    queryFn: () => base44.entities.ProjectCustomization.list(),
  });

  const { data: taskCustomList = [] } = useQuery({
    queryKey: ["task_customization"],
    queryFn: () => base44.entities.TaskCustomization.list(),
  });

  const settings = settingsList[0] || null;
  const projectCustom = projectCustomList[0] || null;
  const taskCustom = taskCustomList[0] || null;

  useEffect(() => {
    if (settings) {
      setForm({
        app_name: settings.app_name || DEFAULT_SETTINGS.app_name,
        app_description: settings.app_description || DEFAULT_SETTINGS.app_description,
        logo_url: settings.logo_url || "",
        primary_color: settings.primary_color || DEFAULT_SETTINGS.primary_color,
        nav_items: settings.nav_items || DEFAULT_SETTINGS.nav_items,
        project_statuses: projectCustom?.statuses || DEFAULT_SETTINGS.project_statuses,
        task_statuses: taskCustom?.statuses || DEFAULT_SETTINGS.task_statuses,
        task_fields: taskCustom?.fields || DEFAULT_SETTINGS.task_fields,
      });
    }
  }, [settings, projectCustom, taskCustom]);

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm((f) => ({ ...f, logo_url: file_url }));
    setUploading(false);
  };

  const handleSave = async () => {
    // Filtrar itens vazios antes de salvar
    const filteredNavItems = form.nav_items.filter(item => item.name && item.page);
    const filteredProjectStatuses = form.project_statuses.filter(s => s.id && s.label);
    const filteredTaskStatuses = form.task_statuses.filter(s => s.id && s.label);

    setSaving(true);
    try {
      // Save AppSettings (sem project_statuses e task_statuses)
      const appSettingsData = {
        app_name: form.app_name,
        app_description: form.app_description,
        logo_url: form.logo_url,
        primary_color: form.primary_color,
        nav_items: filteredNavItems,
      };

      if (settings && settings.id) {
        await base44.entities.AppSettings.update(settings.id, appSettingsData);
      } else {
        await base44.entities.AppSettings.create(appSettingsData);
      }

      // Save ProjectCustomization
      const projectCustomData = { statuses: filteredProjectStatuses };
      if (projectCustom && projectCustom.id) {
        await base44.entities.ProjectCustomization.update(projectCustom.id, projectCustomData);
      } else {
        await base44.entities.ProjectCustomization.create(projectCustomData);
      }

      // Save TaskCustomization
      const filteredTaskFields = form.task_fields.filter(f => f.id && f.label);
      const taskCustomData = { 
        statuses: filteredTaskStatuses,
        fields: filteredTaskFields
      };
      if (taskCustom && taskCustom.id) {
        await base44.entities.TaskCustomization.update(taskCustom.id, taskCustomData);
      } else {
        await base44.entities.TaskCustomization.create(taskCustomData);
      }

      qc.invalidateQueries({ queryKey: ["app_settings"] });
      qc.invalidateQueries({ queryKey: ["project_customization"] });
      qc.invalidateQueries({ queryKey: ["task_customization"] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (error) {
      console.error("Erro ao salvar:", error);
      alert("Erro ao salvar configurações");
    } finally {
      setSaving(false);
    }
  };

  const updateNavItem = (index, field, value) => {
    const updated = [...form.nav_items];
    updated[index] = { ...updated[index], [field]: value };
    setForm({ ...form, nav_items: updated });
  };

  const removeNavItem = (index) => {
    setForm({ ...form, nav_items: form.nav_items.filter((_, i) => i !== index) });
  };

  const addNavItem = () => {
    setForm({ ...form, nav_items: [...form.nav_items, { name: "", page: "" }] });
  };

  const updateStatus = (type, index, field, value) => {
    const statusKey = type === "project" ? "project_statuses" : "task_statuses";
    const updated = [...form[statusKey]];
    updated[index] = { ...updated[index], [field]: value };
    setForm({ ...form, [statusKey]: updated });
  };

  const removeStatus = (type, index) => {
    const statusKey = type === "project" ? "project_statuses" : "task_statuses";
    setForm({ ...form, [statusKey]: form[statusKey].filter((_, i) => i !== index) });
  };

  const addStatus = (type) => {
    const statusKey = type === "project" ? "project_statuses" : "task_statuses";
    setForm(prev => ({
      ...prev,
      [statusKey]: [...prev[statusKey], { id: "", label: "", color: "#3B82F6" }]
    }));
  };

  const updateField = (index, field, value) => {
    const updated = [...form.task_fields];
    updated[index] = { ...updated[index], [field]: value };
    setForm({ ...form, task_fields: updated });
  };

  const removeField = (index) => {
    setForm({ ...form, task_fields: form.task_fields.filter((_, i) => i !== index) });
  };

  const addField = () => {
    setForm(prev => ({
      ...prev,
      task_fields: [...prev.task_fields, { id: "", label: "", type: "text", required: false, options: [] }]
    }));
  };

  const updateFieldOption = (fieldIndex, optIndex, field, value) => {
    const updated = [...form.task_fields];
    if (!updated[fieldIndex].options) updated[fieldIndex].options = [];
    updated[fieldIndex].options[optIndex] = { ...updated[fieldIndex].options[optIndex], [field]: value };
    setForm({ ...form, task_fields: updated });
  };

  const removeFieldOption = (fieldIndex, optIndex) => {
    const updated = [...form.task_fields];
    updated[fieldIndex].options = updated[fieldIndex].options.filter((_, i) => i !== optIndex);
    setForm({ ...form, task_fields: updated });
  };

  const addFieldOption = (fieldIndex) => {
    const updated = [...form.task_fields];
    if (!updated[fieldIndex].options) updated[fieldIndex].options = [];
    updated[fieldIndex].options.push({ id: "", label: "" });
    setForm({ ...form, task_fields: updated });
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
        <p className="text-gray-500 text-sm mt-1">Personalize completamente seu aplicativo</p>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general">Geral</TabsTrigger>
          <TabsTrigger value="nav">Menu</TabsTrigger>
          <TabsTrigger value="projects">Projetos</TabsTrigger>
          <TabsTrigger value="tasks">Status Tarefas</TabsTrigger>
          <TabsTrigger value="task-fields">Campos Tarefas</TabsTrigger>
        </TabsList>

        {/* Geral */}
        <TabsContent value="general" className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
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
        </TabsContent>

        {/* Menu */}
        <TabsContent value="nav" className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <div className="space-y-3">
            {form.nav_items.map((item, idx) => (
              <div key={idx} className="flex gap-2 items-end pb-3 border-b border-gray-100 last:border-b-0">
                <div className="flex-1">
                  <Label className="text-xs font-medium text-gray-700">Rótulo</Label>
                  <Input
                    value={item.name}
                    onChange={(e) => updateNavItem(idx, "name", e.target.value)}
                    placeholder="Ex: Dashboard"
                    className="mt-1"
                  />
                </div>
                <div className="flex-1">
                  <Label className="text-xs font-medium text-gray-700">Página</Label>
                  <Input
                    value={item.page}
                    onChange={(e) => updateNavItem(idx, "page", e.target.value)}
                    placeholder="Ex: Dashboard"
                    className="mt-1"
                  />
                </div>
                <Button variant="ghost" size="sm" onClick={() => removeNavItem(idx)} className="text-red-500 hover:bg-red-50 hover:text-red-700">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
          <Button variant="outline" onClick={addNavItem} className="w-full gap-2">
            <Plus className="w-4 h-4" /> Adicionar item
          </Button>
        </TabsContent>

        {/* Projetos */}
         <TabsContent value="projects" className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
           <div className="space-y-3">
             {form.project_statuses?.map((status, idx) => (
               <div key={`project-${idx}`} className="flex gap-2 items-end pb-3 border-b border-gray-100 last:border-b-0">
                <div className="flex-1">
                  <Label className="text-xs font-medium text-gray-700">ID</Label>
                  <Input
                    value={status.id}
                    onChange={(e) => updateStatus("project", idx, "id", e.target.value)}
                    placeholder="Ex: active"
                    className="mt-1"
                  />
                </div>
                <div className="flex-1">
                  <Label className="text-xs font-medium text-gray-700">Rótulo</Label>
                  <Input
                    value={status.label}
                    onChange={(e) => updateStatus("project", idx, "label", e.target.value)}
                    placeholder="Ex: Ativo"
                    className="mt-1"
                  />
                </div>
                <div className="w-16">
                  <Label className="text-xs font-medium text-gray-700">Cor</Label>
                  <div className="mt-1 flex gap-1">
                    {COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => updateStatus("project", idx, "color", c)}
                        className="w-6 h-6 rounded-full border-2 transition-all"
                        style={{ backgroundColor: c, borderColor: status.color === c ? "#1F2937" : "transparent" }}
                      />
                    ))}
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => removeStatus("project", idx)} className="text-red-500 hover:bg-red-50 hover:text-red-700">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
          <Button variant="outline" onClick={() => addStatus("project")} className="w-full gap-2">
            <Plus className="w-4 h-4" /> Adicionar status
          </Button>
        </TabsContent>

        {/* Tarefas */}
         <TabsContent value="tasks" className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
           <div className="space-y-3">
             {form.task_statuses?.map((status, idx) => (
               <div key={`task-${idx}`} className="flex gap-2 items-end pb-3 border-b border-gray-100 last:border-b-0">
                <div className="flex-1">
                  <Label className="text-xs font-medium text-gray-700">ID</Label>
                  <Input
                    value={status.id}
                    onChange={(e) => updateStatus("task", idx, "id", e.target.value)}
                    placeholder="Ex: approved"
                    className="mt-1"
                  />
                </div>
                <div className="flex-1">
                  <Label className="text-xs font-medium text-gray-700">Rótulo</Label>
                  <Input
                    value={status.label}
                    onChange={(e) => updateStatus("task", idx, "label", e.target.value)}
                    placeholder="Ex: Aprovado"
                    className="mt-1"
                  />
                </div>
                <div className="w-16">
                  <Label className="text-xs font-medium text-gray-700">Cor</Label>
                  <div className="mt-1 flex gap-1">
                    {COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => updateStatus("task", idx, "color", c)}
                        className="w-6 h-6 rounded-full border-2 transition-all"
                        style={{ backgroundColor: c, borderColor: status.color === c ? "#1F2937" : "transparent" }}
                      />
                    ))}
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => removeStatus("task", idx)} className="text-red-500 hover:bg-red-50 hover:text-red-700">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
          <Button variant="outline" onClick={() => addStatus("task")} className="w-full gap-2">
            <Plus className="w-4 h-4" /> Adicionar status
          </Button>
        </TabsContent>

        {/* Campos Tarefas */}
        <TabsContent value="task-fields" className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <div className="space-y-4">
            {form.task_fields?.map((field, idx) => (
              <div key={`field-${idx}`} className="border border-gray-100 rounded-lg p-4 space-y-3">
                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <Label className="text-xs font-medium text-gray-700">ID do Campo</Label>
                    <Input
                      value={field.id}
                      onChange={(e) => updateField(idx, "id", e.target.value)}
                      placeholder="Ex: deadline"
                      className="mt-1"
                    />
                  </div>
                  <div className="flex-1">
                    <Label className="text-xs font-medium text-gray-700">Rótulo</Label>
                    <Input
                      value={field.label}
                      onChange={(e) => updateField(idx, "label", e.target.value)}
                      placeholder="Ex: Prazo"
                      className="mt-1"
                    />
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => removeField(idx)} className="text-red-500 hover:bg-red-50 hover:text-red-700">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Label className="text-xs font-medium text-gray-700">Tipo</Label>
                    <select
                      value={field.type}
                      onChange={(e) => updateField(idx, "type", e.target.value)}
                      className="w-full mt-1 px-3 py-1.5 border border-gray-200 rounded-md text-sm"
                    >
                      <option value="text">Texto</option>
                      <option value="date">Data</option>
                      <option value="select">Seleção</option>
                      <option value="number">Número</option>
                      <option value="file">Arquivo</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={field.required}
                        onChange={(e) => updateField(idx, "required", e.target.checked)}
                        className="rounded"
                      />
                      <span className="text-xs font-medium text-gray-700">Obrigatório</span>
                    </label>
                  </div>
                </div>

                {field.type === "select" && (
                  <div className="space-y-2 pl-2 border-l-2 border-gray-200">
                    <Label className="text-xs font-medium text-gray-700">Opções</Label>
                    <div className="space-y-2">
                      {field.options?.map((opt, optIdx) => (
                        <div key={optIdx} className="flex gap-2 items-end">
                          <Input
                            value={opt.id}
                            onChange={(e) => updateFieldOption(idx, optIdx, "id", e.target.value)}
                            placeholder="ID"
                            size="sm"
                            className="w-20"
                          />
                          <Input
                            value={opt.label}
                            onChange={(e) => updateFieldOption(idx, optIdx, "label", e.target.value)}
                            placeholder="Rótulo"
                            size="sm"
                            className="flex-1"
                          />
                          <Button variant="ghost" size="sm" onClick={() => removeFieldOption(idx, optIdx)} className="text-red-500 hover:bg-red-50">
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                    <Button variant="outline" size="sm" onClick={() => addFieldOption(idx)} className="w-full gap-1 text-xs">
                      <Plus className="w-3 h-3" /> Opção
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
          <Button variant="outline" onClick={addField} className="w-full gap-2">
            <Plus className="w-4 h-4" /> Adicionar Campo
          </Button>
        </TabsContent>
      </Tabs>

      {/* Save */}
      <div className="mt-6 flex items-center justify-end gap-3">
        {saved && (
          <span className="flex items-center gap-1 text-sm text-green-600">
            <CheckCircle2 className="w-4 h-4" /> Salvo com sucesso!
          </span>
        )}
        <Button onClick={handleSave} disabled={saving} className="flex items-center gap-2">
          <Save className="w-4 h-4" />
          {saving ? "Salvando..." : "Salvar todas as alterações"}
        </Button>
      </div>
    </div>
  );
}