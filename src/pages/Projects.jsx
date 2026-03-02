import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Plus, Search, FolderOpen, LayoutGrid, FolderTree, ChevronDown, ChevronRight, Folder, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ClientCard from "../components/projects/ClientCard";
import ClientFormModal from "../components/projects/ClientFormModal";
import TaskList from "../components/projects/TaskList";
import FolderView from "../components/projects/FolderView";

export default function Projects() {
  const [selectedClient, setSelectedClient] = useState(null);
  const [viewMode, setViewMode] = useState("cards"); // "cards" | "folder"
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [search, setSearch] = useState("");
  const [detailView, setDetailView] = useState("list"); // "list" | "folder"
  const qc = useQueryClient();

  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: () => base44.entities.Client.list("-created_date"),
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ["tasks"],
    queryFn: () => base44.entities.Task.list(),
  });

  const { data: subProjects = [] } = useQuery({
    queryKey: ["subprojects"],
    queryFn: () => base44.entities.SubProject.list(),
  });

  // Read ?client= from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const clientId = params.get("client");
    if (clientId && clients.length > 0) {
      const found = clients.find((c) => c.id === clientId);
      if (found) setSelectedClient(found);
    }
  }, [clients]);

  const filtered = clients.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSaveClient = async (form) => {
    if (editingClient) {
      await base44.entities.Client.update(editingClient.id, form);
    } else {
      await base44.entities.Client.create(form);
    }
    qc.invalidateQueries(["clients"]);
    setShowModal(false);
    setEditingClient(null);
  };

  const handleDeleteClient = async (client) => {
    if (!confirm(`Excluir a obra "${client.name}"? Os serviços e tarefas também serão excluídos.`)) return;
    const clientTasks = tasks.filter((t) => t.client_id === client.id);
    const clientSubs = subProjects.filter((s) => s.client_id === client.id);
    await Promise.all([
      ...clientTasks.map((t) => base44.entities.Task.delete(t.id)),
      ...clientSubs.map((s) => base44.entities.SubProject.delete(s.id)),
    ]);
    await base44.entities.Client.delete(client.id);
    qc.invalidateQueries(["clients"]);
    qc.invalidateQueries(["tasks"]);
    qc.invalidateQueries(["subprojects"]);
  };

  const handleSelectClient = (client, mode = "list") => {
    setSelectedClient(client);
    setDetailView(mode);
    window.history.pushState({}, "", `?client=${client.id}`);
  };

  const handleBack = () => {
    setSelectedClient(null);
    window.history.pushState({}, "", window.location.pathname);
  };

  // ── Detail view (inside a project) ──
  if (selectedClient) {
    return (
      <div className="max-w-6xl mx-auto">
        {/* Toggle between list and folder inside detail */}
        <div className="flex items-center gap-2 mb-5">
          <button
            onClick={() => setDetailView("list")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border transition-colors ${detailView === "list" ? "bg-gray-900 text-white border-gray-900" : "text-gray-600 border-gray-200 hover:bg-gray-50"}`}
          >
            <LayoutGrid className="w-3.5 h-3.5" /> Lista
          </button>
          <button
            onClick={() => setDetailView("folder")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border transition-colors ${detailView === "folder" ? "bg-gray-900 text-white border-gray-900" : "text-gray-600 border-gray-200 hover:bg-gray-50"}`}
          >
            <FolderTree className="w-3.5 h-3.5" /> Pastas
          </button>
        </div>

        {detailView === "folder" ? (
          <FolderView client={selectedClient} subProjects={subProjects} tasks={tasks} onBack={handleBack} />
        ) : (
          <TaskList client={selectedClient} tasks={tasks} onBack={handleBack} />
        )}
      </div>
    );
  }

  // ── Projects listing ──
  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Obras</h1>
          <p className="text-gray-500 text-sm mt-1">{clients.length} obra{clients.length !== 1 ? "s" : ""} cadastrada{clients.length !== 1 ? "s" : ""}</p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode("cards")}
              className={`px-3 py-2 flex items-center gap-1.5 text-sm transition-colors ${viewMode === "cards" ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-50"}`}
            >
              <LayoutGrid className="w-4 h-4" /> Cards
            </button>
            <button
              onClick={() => setViewMode("folder")}
              className={`px-3 py-2 flex items-center gap-1.5 text-sm transition-colors ${viewMode === "folder" ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-50"}`}
            >
              <FolderTree className="w-4 h-4" /> Pastas
            </button>
          </div>
          <Button onClick={() => { setEditingClient(null); setShowModal(true); }} className="flex items-center gap-2">
            <Plus className="w-4 h-4" /> Nova Obra
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          placeholder="Buscar obras..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-base font-medium">Nenhuma obra encontrada</p>
          <p className="text-sm mt-1">
            {search ? "Tente um termo diferente" : "Clique em 'Nova Obra' para começar"}
          </p>
        </div>
      ) : viewMode === "cards" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((client) => (
            <ClientCard
              key={client.id}
              client={client}
              tasks={tasks}
              onClick={() => handleSelectClient(client, "list")}
              onEdit={(c) => { setEditingClient(c); setShowModal(true); }}
              onDelete={handleDeleteClient}
            />
          ))}
        </div>
      ) : (
        // Folder view listing all projects as a tree
        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-1">
          {filtered.map((client) => {
            const clientSubs = subProjects.filter((s) => s.client_id === client.id);
            const clientTasks = tasks.filter((t) => t.client_id === client.id);
            const approved = clientTasks.filter((t) => t.status === "approved").length;
            const percent = clientTasks.length ? Math.round((approved / clientTasks.length) * 100) : 0;

            return (
              <ProjectFolderRow
                key={client.id}
                client={client}
                subProjects={clientSubs}
                tasks={tasks}
                percent={percent}
                onOpen={() => handleSelectClient(client, "folder")}
                onEdit={(c) => { setEditingClient(c); setShowModal(true); }}
                onDelete={handleDeleteClient}
              />
            );
          })}
        </div>
      )}

      <ClientFormModal
        open={showModal}
        onClose={() => { setShowModal(false); setEditingClient(null); }}
        onSave={handleSaveClient}
        client={editingClient}
      />
    </div>
  );
}

// ─── Folder row for listing view ───
function ProjectFolderRow({ client, subProjects, tasks, percent, onOpen, onEdit, onDelete }) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <div
        className="flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-gray-50 cursor-pointer group"
        onClick={() => setOpen(!open)}
      >
        {open
          ? <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
          : <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
        }
        {open
          ? <FolderOpen className="w-5 h-5 flex-shrink-0" style={{ color: client.color || "#3B82F6" }} />
          : <Folder className="w-5 h-5 flex-shrink-0" style={{ color: client.color || "#3B82F6" }} />
        }
        <span className="text-sm font-semibold text-gray-900 flex-1">{client.name}</span>

        {tasks.filter(t => t.client_id === client.id).length > 0 && (
          <div className="flex items-center gap-2 text-xs text-gray-400 mr-2">
            <div className="w-20 bg-gray-200 rounded-full h-1.5">
              <div className="bg-green-400 h-1.5 rounded-full" style={{ width: `${percent}%` }} />
            </div>
            <span>{percent}%</span>
          </div>
        )}

        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
          <button onClick={onOpen} className="text-xs text-blue-600 hover:text-blue-800 px-2 py-1 rounded hover:bg-blue-50 border border-transparent hover:border-blue-200">Abrir</button>
          <button onClick={() => onEdit(client)} className="p-1 text-gray-400 hover:text-gray-700 rounded"><Pencil className="w-3.5 h-3.5" /></button>
          <button onClick={() => onDelete(client)} className="p-1 text-gray-400 hover:text-red-500 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
        </div>
      </div>

      {open && (
        <div className="ml-6 border-l-2 border-gray-100 pl-2 space-y-0.5 mb-1">
          {subProjects.length === 0 ? (
            <p className="text-xs text-gray-400 py-1 pl-2 italic">Nenhum serviço</p>
          ) : (
            subProjects.map((sub) => {
              const subTasks = tasks.filter((t) => t.sub_project_id === sub.id);
              return (
                <div key={sub.id} className="ml-2">
                  <div className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-gray-50 cursor-default group">
                    <Folder className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    <span className="text-sm text-gray-700 flex-1">{sub.name}</span>
                    <span className="text-xs text-gray-400">{subTasks.length} tarefa{subTasks.length !== 1 ? "s" : ""}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}