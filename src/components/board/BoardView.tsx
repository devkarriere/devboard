import { useState, useRef } from "react";
import {
  DndContext,
  closestCorners,
  type DragStartEvent,
  type DragOverEvent,

  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { ColumnComponent } from "./ColumnComponent";
import { EditTaskDialog } from "@/components/task/EditTaskDialog";
import { addTask, deleteTask, updateTask, moveTask } from "@/lib/storage";
import { useUserName } from "@/context/UserNameContext";
import type { Board, Task } from "@/types";

interface BoardViewProps {
  board: Board;
  onBoardChange: () => void; // Wird aufgerufen, um das Board neu zu laden
}

// Kanban-Board-Ansicht mit Drag & Drop für Tasks zwischen Spalten
export function BoardView({ board, onBoardChange }: BoardViewProps) {
  const { userName } = useUserName();
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const targetColumnRef = useRef<string | null>(null);

  // Sensor-Konfiguration: Erst nach 5px Bewegung startet der Drag
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  // Spalten nach Order sortieren
  const sortedColumns = [...board.columns].sort((a, b) => a.order - b.order);

  // Neue Task erstellen
  function handleAddTask(columnId: string, title: string, description: string, assignedTo: string, deadline?: string) {
    const task = addTask(board.id, columnId, title, description, assignedTo);
    if (deadline) updateTask(board.id, task.id, { deadline });
    onBoardChange();
  }

  // Task löschen
  function handleDeleteTask(taskId: string) {
    deleteTask(board.id, taskId);
    onBoardChange();
  }

  // Task bearbeiten
  function handleEditTask(taskId: string, title: string, description: string, assignedTo: string, deadline?: string) {
    updateTask(board.id, taskId, { title, description, assignedTo, deadline: deadline ?? "" });
    onBoardChange();
  }

  // --- Drag & Drop Handler ---

  function handleDragStart(event: DragStartEvent) {
    const task = board.tasks.find((t) => t.id === event.active.id);
    if (task) {
      setActiveTask(task);
      targetColumnRef.current = null;
    }
  }

  function handleDragOver(event: DragOverEvent) {
    const { over } = event;
    if (!over) return;

    const overColumnId = over.id as string;
    const columnExists = board.columns.some((c) => c.id === overColumnId);
    if (columnExists) {
      targetColumnRef.current = overColumnId;
    }
  }

  function handleDragEnd() {
    if (activeTask && targetColumnRef.current && activeTask.columnId !== targetColumnRef.current) {
      moveTask(board.id, activeTask.id, targetColumnRef.current);
      onBoardChange();
    }
    targetColumnRef.current = null;
    setActiveTask(null);
  }

  return (
    <div>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {sortedColumns.map((column) => (
            <ColumnComponent
              key={column.id}
              column={column}
              tasks={board.tasks.filter((t) => t.columnId === column.id).sort((a, b) => (b.order ?? 0) - (a.order ?? 0))}
              onAddTask={handleAddTask}
              onDeleteTask={handleDeleteTask}
              onEditTask={setEditingTask}
              isDragging={activeTask !== null}
            />
          ))}
        </div>


      </DndContext>

      {/* Dialog: Task bearbeiten */}
      <EditTaskDialog
        task={editingTask}
        open={editingTask !== null}
        onOpenChange={(open) => { if (!open) setEditingTask(null); }}
        onSave={handleEditTask}
        userName={userName}
      />
    </div>
  );
}
