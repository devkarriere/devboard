import { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TaskCard } from "@/components/task/TaskCard";
import { AddTaskDialog } from "@/components/task/AddTaskDialog";
import type { Column, Task } from "@/types";

interface ColumnComponentProps {
  column: Column;
  tasks: Task[]; // Nur die Tasks dieser Spalte
  onAddTask: (columnId: string, title: string, description: string) => void;
  onDeleteTask: (taskId: string) => void;
  onEditTask: (task: Task) => void;
}

// Eine einzelne Kanban-Spalte mit ihren Tasks (Droppable für Drag & Drop)
export function ColumnComponent({
  column,
  tasks,
  onAddTask,
  onDeleteTask,
  onEditTask,
}: ColumnComponentProps) {
  const [showAddTask, setShowAddTask] = useState(false);

  // Droppable-Zone: Damit Tasks in diese Spalte gezogen werden können
  const { setNodeRef } = useDroppable({ id: column.id });

  return (
    <div className="flex w-72 flex-shrink-0 flex-col rounded-lg bg-muted/50 border">
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

      {/* Task-Liste (Droppable + Sortable) */}
      <div ref={setNodeRef} className="flex-1 space-y-2 p-2 min-h-[100px]">
        <SortableContext
          items={tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} onDelete={onDeleteTask} onEdit={onEditTask} />
          ))}
        </SortableContext>
      </div>

      {/* Dialog zum Hinzufügen einer Task */}
      <AddTaskDialog
        open={showAddTask}
        onOpenChange={setShowAddTask}
        onAdd={(title, description) => onAddTask(column.id, title, description)}
      />
    </div>
  );
}
