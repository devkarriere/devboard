import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TaskCard } from "@/components/task/TaskCard";
import { AddTaskDialog } from "@/components/task/AddTaskDialog";
import { useUserName } from "@/context/UserNameContext";
import type { Column, Task } from "@/types";

interface ColumnComponentProps {
  column: Column;
  columns: Column[]; // Alle Spalten (für das Verschieben-Dropdown)
  tasks: Task[]; // Nur die Tasks dieser Spalte
  draggingFromColumnId: string | null; // Aus welcher Spalte wird gerade gezogen?
  onAddTask: (columnId: string, title: string, description: string, assignedTo: string, deadline?: string) => void;
  onDeleteTask: (taskId: string) => void;
  onEditTask: (task: Task) => void;
  onMoveTask: (taskId: string, newColumnId: string) => void;
  onDragStart: (columnId: string) => void;
  onDragEnd: () => void;
}

// Eine einzelne Kanban-Spalte mit ihren Tasks
export function ColumnComponent({
  column,
  columns,
  tasks,
  draggingFromColumnId,
  onAddTask,
  onDeleteTask,
  onEditTask,
  onMoveTask,
  onDragStart,
  onDragEnd,
}: ColumnComponentProps) {
  const { userName } = useUserName();
  const [showAddTask, setShowAddTask] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  // isDragOver zurücksetzen, wenn der Drag endet
  useEffect(() => {
    if (!draggingFromColumnId) setIsDragOver(false);
  }, [draggingFromColumnId]);

  // Wird gerade aus dieser Spalte gezogen? → Drop hier nicht erlaubt
  const isSameColumn = draggingFromColumnId === column.id;
  const isDragging = draggingFromColumnId !== null;

  return (
    <div
      onDragOver={(e) => {
        if (isSameColumn) return; // Drop in gleicher Spalte nicht erlauben
        e.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(e) => {
        if (isSameColumn) return;
        const taskId = e.dataTransfer.getData("taskId");
        if (taskId) onMoveTask(taskId, column.id);
        setIsDragOver(false);
      }}
      className={`flex w-72 flex-shrink-0 flex-col rounded-lg bg-muted/50 border ${
        isDragging && isDragOver && !isSameColumn ? "ring-2 ring-primary" : ""
      }`}
    >
      {/* Spalten-Header */}
      <div className="flex items-center justify-between p-3 border-b">
        <h3 className="font-semibold text-sm">
          {column.title}
          <span className="ml-2 text-muted-foreground font-normal">
            {tasks.length}
          </span>
        </h3>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => setShowAddTask(true)}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Drop-Zone: zeigt an, dass Tasks oben eingefügt werden */}
      {isDragging && isDragOver && !isSameColumn && (
        <div className="h-10 mx-2 mt-2 rounded border-2 border-dashed border-primary/50 bg-primary/5 flex items-center justify-center text-xs text-primary/50">
          Hier ablegen
        </div>
      )}

      {/* Task-Liste */}
      <div className="flex-1 space-y-2 p-2 min-h-[100px]">
        {tasks.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-6">Keine Tasks vorhanden</p>
        ) : (
          tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onDelete={onDeleteTask}
              onEdit={onEditTask}
              onDragStart={() => onDragStart(column.id)}
              onDragEnd={onDragEnd}
            />
          ))
        )}
      </div>

      {/* Dialog zum Hinzufügen einer Task */}
      <AddTaskDialog
        open={showAddTask}
        onOpenChange={setShowAddTask}
        userName={userName}
        onAdd={(title, description, assignedTo, deadline) => onAddTask(column.id, title, description, assignedTo, deadline)}
      />
    </div>
  );
}
