import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2, User } from "lucide-react";
import type { Task } from "@/types";

interface TaskCardProps {
  task: Task;
  onDelete: (taskId: string) => void;
  onEdit?: (task: Task) => void;
}

// Einzelne Task-Karte – per Drag & Drop verschiebbar
export function TaskCard({ task, onDelete, onEdit }: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-lg border bg-white p-3 shadow-sm ${
        isDragging ? "opacity-50" : ""
      }`}
    >
      <div className="flex items-start gap-2">
        {/* Drag Handle */}
        <button
          {...attributes}
          {...listeners}
          className="mt-0.5 cursor-grab text-muted-foreground hover:text-foreground"
        >
          <GripVertical className="h-4 w-4" />
        </button>

        {/* Task-Inhalt */}
        <div className="flex-1 min-w-0">
          <h4
            className="font-medium text-sm cursor-pointer hover:underline"
            onClick={() => onEdit?.(task)}
          >
            {task.title}
          </h4>
          {task.description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {task.description}
            </p>
          )}
          {/* Zugewiesene Person */}
          <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
            <User className="h-3 w-3" />
            <span>{task.assignedTo}</span>
          </div>
        </div>

        {/* Löschen-Button */}
        <button
          onClick={() => onDelete(task.id)}
          className="text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
