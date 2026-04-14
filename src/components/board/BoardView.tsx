import { useState } from "react";
import { ColumnComponent } from "./ColumnComponent";
import { EditTaskDialog } from "@/components/task/EditTaskDialog";
import { addTask, deleteTask, updateTask, moveTask } from "@/lib/storage";
import { useUserName } from "@/context/UserNameContext";
import type { Board, Task } from "@/types";

interface BoardViewProps {
  board: Board;
  onBoardChange: () => void; // Wird aufgerufen, um das Board neu zu laden
}

// Kanban-Board-Ansicht
export function BoardView({ board, onBoardChange }: BoardViewProps) {
  const { userName } = useUserName();
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [draggingFromColumnId, setDraggingFromColumnId] = useState<string | null>(null);

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

  // Task in eine andere Spalte verschieben
  function handleMoveTask(taskId: string, newColumnId: string) {
    moveTask(board.id, taskId, newColumnId);
    onBoardChange();
  }

  return (
    <div>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {sortedColumns.map((column) => (
          <ColumnComponent
            key={column.id}
            column={column}
            columns={board.columns}
            tasks={board.tasks.filter((t) => t.columnId === column.id)}
            draggingFromColumnId={draggingFromColumnId}
            onAddTask={handleAddTask}
            onDeleteTask={handleDeleteTask}
            onEditTask={setEditingTask}
            onMoveTask={handleMoveTask}
            onDragStart={(columnId) => setDraggingFromColumnId(columnId)}
            onDragEnd={() => setDraggingFromColumnId(null)}
          />
        ))}
      </div>

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
