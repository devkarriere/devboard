import { useState } from "react";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TaskCard } from "@/components/task/TaskCard";
import { AddTaskDialog } from "@/components/task/AddTaskDialog";
import { EditColumnDialog } from "./EditColumnDialog";
import type { Column, Task } from "@/types";

interface ColumnComponentProps {
  column: Column;
  tasks: Task[]; // Nur die Tasks dieser Spalte
  onAddTask: (columnId: string, title: string, description: string, assignedTo: string) => void;
  onDeleteTask: (taskId: string) => void;
  onDeleteColumn: (columnId: string) => void;
  onRenameColumn: (columnId: string, title: string) => void;
  onEditTask: (task: Task) => void;
  members: { id: string; name: string }[];
}

// Eine einzelne Kanban-Spalte mit ihren Tasks
export function ColumnComponent({
  column,
  tasks,
  onAddTask,
  onDeleteTask,
  onDeleteColumn,
  onRenameColumn,
  onEditTask,
  members,
}: ColumnComponentProps) {
  const [showAddTask, setShowAddTask] = useState(false);
  const [showEditColumn, setShowEditColumn] = useState(false);

  // Sortable: Spalte kann per Drag & Drop verschoben werden
  const {
    attributes,
    listeners,
    setNodeRef: setSortableRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: column.id, data: { type: "column" } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Droppable-Zone: Damit Tasks in diese Spalte gezogen werden können
  const { setNodeRef: setDroppableRef } = useDroppable({ id: column.id });

  // Tasks nach Order sortieren
  const sortedTasks = [...tasks].sort((a, b) => a.order - b.order);

  return (
    <div
      ref={setSortableRef}
      style={style}
      className="flex w-72 flex-shrink-0 flex-col rounded-lg bg-muted/50 border"
    >
      {/* Spalten-Header */}
      <div className="flex items-center justify-between p-3 border-b">
        <div className="flex items-center gap-1">
          <button {...attributes} {...listeners} className="cursor-grab touch-none text-muted-foreground hover:text-foreground">
            <GripVertical className="h-4 w-4" />
          </button>
          <h3 className="font-semibold text-sm">
            {column.title}
            <span className="ml-2 text-muted-foreground font-normal">
              {tasks.length}
            </span>
          </h3>
        </div>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setShowAddTask(true)}
          >
            <Plus className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setShowEditColumn(true)}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-destructive"
            onClick={() => onDeleteColumn(column.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Task-Liste (Droppable + Sortable) */}
      <div ref={setDroppableRef} className="flex-1 space-y-2 p-2 min-h-[100px]">
        <SortableContext
          items={sortedTasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {sortedTasks.map((task) => (
            <TaskCard key={task.id} task={task} onDelete={onDeleteTask} onEdit={onEditTask} />
          ))}
        </SortableContext>
      </div>

      {/* Dialog zum Umbenennen der Spalte */}
      <EditColumnDialog
        open={showEditColumn}
        onOpenChange={setShowEditColumn}
        currentTitle={column.title}
        onSave={(title) => onRenameColumn(column.id, title)}
      />

      {/* Dialog zum Hinzufügen einer Task */}
      <AddTaskDialog
        open={showAddTask}
        onOpenChange={setShowAddTask}
        onAdd={(title, description, assignedTo) =>
          onAddTask(column.id, title, description, assignedTo)
        }
        members={members}
      />
    </div>
  );
}
