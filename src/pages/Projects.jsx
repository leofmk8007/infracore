import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Plus, Search, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ClientCard from "../components/projects/ClientCard";
import ClientFormModal from "../components/projects/ClientFormModal";
import FolderView from "../components/projects/FolderView";

export default function Projects() {
  const [selectedClient, setSelectedClient] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [search, setSearch] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const qc = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => setCurrentUser(null));
  }, []);

  const isAdmin = currentUser?.role === "admin";

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
    if (!isAdmin) return;
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
    if (!isAdmin) return;
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

  const handleSelectClient = (client) => {
    setSelectedClient(client);
    window.history.pushState({}, "", `?client=${client.id}`);
  };

  const handleBack = () => {
    setSelectedClient(null);
    window.history.pushState({}, "", window.location.pathname);
  };

  if (selectedClient) {
    return (
      <FolderView
        client={selectedClient}
        subProjects={subProjects}
        tasks={tasks}
        onBack={handleBack}
        isAdmin={isAdmin}
      />
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Obras</h1>
          <p className="text-gray-500 text-sm mt-1">{clients.length} obra{clients.length !== 1 ? "s" : ""} cadastrada{clients.length !== 1 ? "s" : ""}</p>
        </div>
        {isAdmin && (
          <Button onClick={() => { setEditingClient(null); setShowModal(true); }} className="flex items-center gap-2">
            <Plus className="w-4 h-4" /> Nova Obra
          </Button>
        )}
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input placeholder="Buscar obras..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-base font-medium">Nenhuma obra encontrada</p>
          <p className="text-sm mt-1">{search ? "Tente um termo diferente" : "Clique em 'Nova Obra' para começar"}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((client) => (
            <ClientCard
              key={client.id}
              client={client}
              tasks={tasks}
              onClick={() => handleSelectClient(client)}
              onEdit={isAdmin ? (c) => { setEditingClient(c); setShowModal(true); } : undefined}
              onDelete={isAdmin ? handleDeleteClient : undefined}
            />
          ))}
        </div>
      )}

      {isAdmin && (
        <ClientFormModal
          open={showModal}
          onClose={() => { setShowModal(false); setEditingClient(null); }}
          onSave={handleSaveClient}
          client={editingClient}
        />
      )}
    </div>
  );
}