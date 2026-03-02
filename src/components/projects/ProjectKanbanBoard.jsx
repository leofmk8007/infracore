import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { base44 } from "@/api/base44Client";
import ProjectCardWithHover from "./ProjectCardWithHover";

export default function ProjectKanbanBoard({ clients, tasks, projectStatuses, onEdit, onDelete, onSelectClient, qc }) {
  const handleDragEnd = async (result) => {
    const { source, destination, draggableId } = result;

    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const newStatus = destination.droppableId;
    const clientId = draggableId;
    const client = clients.find((c) => c.id === clientId);

    if (client && client.status !== newStatus) {
      await base44.entities.Client.update(clientId, { status: newStatus });
      qc.invalidateQueries(["clients"]);
    }
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 overflow-x-auto pb-4">
        {projectStatuses.map((status) => (
          <Droppable key={status.id} droppableId={status.id}>
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={`rounded-xl border-2 transition-all ${
                  snapshot.isDraggingOver
                    ? "bg-blue-50 border-blue-300"
                    : "bg-gray-50 border-gray-200"
                } p-4 min-h-[500px] flex flex-col`}
              >
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: status.color }}
                  />
                  <h3 className="font-semibold text-gray-900">{status.label}</h3>
                  <span className="ml-auto bg-gray-200 px-2 py-1 rounded text-xs font-medium text-gray-600">
                    {clients.filter((c) => c.status === status.id).length}
                  </span>
                </div>

                <div className="flex-1 space-y-3">
                  {clients
                    .filter((c) => c.status === status.id)
                    .map((client, idx) => (
                      <Draggable key={client.id} draggableId={client.id} index={idx}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={snapshot.isDragging ? "opacity-50" : ""}
                          >
                            <ProjectCardWithHover
                              client={client}
                              tasks={tasks}
                              onEdit={onEdit}
                              onDelete={onDelete}
                              onSelect={onSelectClient}
                            />
                          </div>
                        )}
                      </Draggable>
                    ))}
                </div>

                {provided.placeholder}
              </div>
            )}
          </Droppable>
        ))}
      </div>
    </DragDropContext>
  );
}