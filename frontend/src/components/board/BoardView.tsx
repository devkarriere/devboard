import { useState, useEffect } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ColumnComponent } from "./ColumnComponent";
import { AddColumnDialog } from "./AddColumnDialog";
import { TaskCard } from "@/components/task/TaskCard";
import { EditTaskDialog } from "@/components/task/EditTaskDialog";
import {
  addColumn,
  updateColumn,
  deleteColumn,
  addTask,
  deleteTask,
  updateTask,
  getAllProfiles,
} from "@/lib/api";
import type { Board, Column, Task } from "@/types";

interface BoardViewProps {
  board: Board;
  onBoardChange: () => void; // Wird aufgerufen, um das Board neu zu laden
}

// Kanban-Board-Ansicht mit allen Spalten und Drag & Drop
export function BoardView({ board, onBoardChange }: BoardViewProps) {
  const [showAddColumn, setShowAddColumn] = useState(false);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [activeColumn, setActiveColumn] = useState<Column | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [memberProfiles, setMemberProfiles] = useState<{ id: string; name: string }[]>([]);

  // Alle User-Profile laden (für Task-Zuweisung)
  useEffect(() => {
    getAllProfiles().then(setMemberProfiles);
  }, []);

  // Sensor-Konfiguration: Erst nach 5px Bewegung startet der Drag
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  // Spalten nach Order sortieren
  const sortedColumns = [...board.columns].sort((a, b) => a.order - b.order);

  // Neue Spalte hinzufügen
  async function handleAddColumn(title: string) {
    await addColumn(board.id, title);
    onBoardChange();
  }

  // Spalte umbenennen
  async function handleRenameColumn(columnId: string, title: string) {
    await updateColumn(board.id, columnId, { title });
    onBoardChange();
  }

  // Spalte löschen
  async function handleDeleteColumn(columnId: string) {
    await deleteColumn(board.id, columnId);
    onBoardChange();
  }

  // Neue Task erstellen
  async function handleAddTask(
    columnId: string,
    title: string,
    description: string,
    assignedTo: string
  ) {
    await addTask(board.id, columnId, title, description, assignedTo);
    onBoardChange();
  }

  // Task löschen
  async function handleDeleteTask(taskId: string) {
    await deleteTask(board.id, taskId);
    onBoardChange();
  }

  // Task bearbeiten
  async function handleEditTask(
    taskId: string,
    title: string,
    description: string,
    assignedTo: string
  ) {
    await updateTask(board.id, taskId, { title, description, assignedTo });
    onBoardChange();
  }

  // --- Drag & Drop Handler ---

  function handleDragStart(event: DragStartEvent) {
    const { active } = event;

    // Spalte wird gezogen
    if (active.data.current?.type === "column") {
      const column = board.columns.find((c) => c.id === active.id);
      if (column) setActiveColumn(column);
      return;
    }

    // Task wird gezogen
    const task = board.tasks.find((t) => t.id === active.id);
    if (task) setActiveTask(task);
  }

  async function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    // Spalten-Drag ignorieren (wird in handleDragEnd behandelt)
    if (active.data.current?.type === "column") return;

    const draggedTask = board.tasks.find((t) => t.id === active.id);
    if (!draggedTask) return;

    // Prüfen, ob über einer anderen Task oder einer Spalte gehovert wird
    const overTask = board.tasks.find((t) => t.id === over.id);
    const overColumnId = overTask ? overTask.columnId : (over.id as string);

    // Prüfen, ob die Ziel-Spalte existiert
    const columnExists = board.columns.some((c) => c.id === overColumnId);
    if (!columnExists) return;

    // Task in neue Spalte verschieben
    if (draggedTask.columnId !== overColumnId) {
      await updateTask(board.id, draggedTask.id, { columnId: overColumnId });
      onBoardChange();
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    // Spalte wurde losgelassen
    if (active.data.current?.type === "column") {
      setActiveColumn(null);

      if (!over || active.id === over.id) return;

      const oldIndex = sortedColumns.findIndex((c) => c.id === active.id);
      const newIndex = sortedColumns.findIndex((c) => c.id === over.id);

      if (oldIndex === -1 || newIndex === -1) return;

      const reordered = arrayMove(sortedColumns, oldIndex, newIndex);

      // Alle Spalten mit neuen Order-Werten sequentiell aktualisieren
      for (let i = 0; i < reordered.length; i++) {
        if (reordered[i].order !== i) {
          await updateColumn(board.id, reordered[i].id, { order: i });
        }
      }
      onBoardChange();
      return;
    }

    // Task wurde losgelassen
    setActiveTask(null);

    if (!over || active.id === over.id) return;

    const draggedTask = board.tasks.find((t) => t.id === active.id);
    const overTask = board.tasks.find((t) => t.id === over.id);

    if (!draggedTask) return;

    // Wenn über eine andere Task gedroppt: Reihenfolge mit arrayMove berechnen
    if (overTask && draggedTask.columnId === overTask.columnId) {
      const columnTasks = board.tasks
        .filter((t) => t.columnId === draggedTask.columnId)
        .sort((a, b) => a.order - b.order);

      const oldIndex = columnTasks.findIndex((t) => t.id === draggedTask.id);
      const newIndex = columnTasks.findIndex((t) => t.id === overTask.id);
      const reordered = arrayMove(columnTasks, oldIndex, newIndex);

      // Alle Tasks mit neuen Order-Werten sequentiell aktualisieren (Mongoose VersionError bei parallel)
      for (let i = 0; i < reordered.length; i++) {
        if (reordered[i].order !== i) {
          await updateTask(board.id, reordered[i].id, { order: i });
        }
      }
      onBoardChange();
    }
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
          <SortableContext
            items={sortedColumns.map((c) => c.id)}
            strategy={horizontalListSortingStrategy}
          >
            {sortedColumns.map((column) => (
              <ColumnComponent
                key={column.id}
                column={column}
                tasks={board.tasks.filter((t) => t.columnId === column.id)}
                onAddTask={handleAddTask}
                onDeleteTask={handleDeleteTask}
                onDeleteColumn={handleDeleteColumn}
                onRenameColumn={handleRenameColumn}
                onEditTask={setEditingTask}
                members={memberProfiles}
              />
            ))}
          </SortableContext>

          {/* Button zum Hinzufügen einer neuen Spalte */}
          <div className="flex w-72 flex-shrink-0 items-start">
            <Button
              variant="outline"
              className="w-full justify-start gap-2 border-dashed"
              onClick={() => setShowAddColumn(true)}
            >
              <Plus className="h-4 w-4" />
              Spalte hinzufügen
            </Button>
          </div>
        </div>

        {/* Drag Overlay: Zeigt Task oder Spalte während des Ziehens */}
        <DragOverlay>
          {activeTask ? (
            <TaskCard task={activeTask} onDelete={() => {}} />
          ) : null}
          {activeColumn ? (
            <div className="w-72 rounded-lg bg-muted/50 border opacity-80 p-3">
              <h3 className="font-semibold text-sm">{activeColumn.title}</h3>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Dialog: Neue Spalte */}
      <AddColumnDialog
        open={showAddColumn}
        onOpenChange={setShowAddColumn}
        onAdd={handleAddColumn}
      />

      {/* Dialog: Task bearbeiten */}
      <EditTaskDialog
        task={editingTask}
        boardId={board.id}
        open={editingTask !== null}
        onOpenChange={(open) => { if (!open) setEditingTask(null); }}
        onSave={handleEditTask}
        members={memberProfiles}
      />
    </div>
  );
}
