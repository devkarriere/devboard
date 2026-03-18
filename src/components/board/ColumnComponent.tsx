import { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TaskCard } from "@/components/task/TaskCard";
import { AddTaskDialog } from "@/components/task/AddTaskDialog";
import { useUserName } from "@/context/UserNameContext";
import type { Column, Task } from "@/types";

interface ColumnComponentProps {
  column: Column;
  tasks: Task[]; // Nur die Tasks dieser Spalte
  onAddTask: (columnId: string, title: string, description: string, assignedTo: string, deadline?: string) => void;
  onDeleteTask: (taskId: string) => void;
  onEditTask: (task: Task) => void;
  isDragging: boolean;
}

// Eine einzelne Kanban-Spalte mit ihren Tasks (Droppable für Drag & Drop)
export function ColumnComponent({
  column,
  tasks,
  onAddTask,
  onDeleteTask,
  onEditTask,
  isDragging,
}: ColumnComponentProps) {
  const { userName } = useUserName();
  const [showAddTask, setShowAddTask] = useState(false);

  // Droppable-Zone: Damit Tasks in diese Spalte gezogen werden können
  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  return (
    <div ref={setNodeRef} className="flex w-72 flex-shrink-0 flex-col rounded-lg bg-muted/50 border">
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

      {/* Task-Liste */}
      <div className="relative flex-1 space-y-2 p-2 min-h-[100px]">
        {/* Drop-Zone oben – nur sichtbar beim Draggen */}
        {isDragging && (
          <div
            className={`absolute inset-x-2 top-2 z-10 rounded-lg border-2 border-dashed p-3 text-center text-xs transition-colors ${
              isOver
                ? "border-primary bg-primary/10 text-primary"
                : "border-muted-foreground/30 text-muted-foreground"
            }`}
          >
            Hier ablegen
          </div>
        )}
        {tasks.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-6">Keine Tasks vorhanden</p>
        ) : (
          tasks.map((task) => (
            <TaskCard key={task.id} task={task} onDelete={onDeleteTask} onEdit={onEditTask} />
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
