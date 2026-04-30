import { useState } from "react";
import { Trash2, Calendar, UserCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Task } from "@/types";

interface TaskCardProps {
  task: Task;
  onDelete: (taskId: string) => void;
  onEdit?: (task: Task) => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
}

// Einzelne Task-Karte
export function TaskCard({ task, onDelete, onEdit, onDragStart: onDragStartProp, onDragEnd: onDragEndProp }: TaskCardProps) {
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <div
      draggable="true"
      onDragStart={(e) => { e.dataTransfer.setData("taskId", task.id); onDragStartProp?.(); }}
      onDragEnd={() => onDragEndProp?.()}
      className="relative rounded-lg border bg-white p-3 shadow-sm cursor-grab active:cursor-grabbing"
    >
      <div className="flex items-start gap-2">
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
          {task.assignedTo && (
            <div className="flex items-center gap-1 mt-1.5 text-xs text-muted-foreground">
              <UserCircle className="h-3 w-3" />
              {task.assignedTo}
            </div>
          )}
          {task.deadline && (
            <div className={`flex items-center gap-1 mt-1.5 text-xs ${
              new Date(task.deadline) < new Date(new Date().toDateString())
                ? "text-destructive"
                : "text-muted-foreground"
            }`}>
              <Calendar className="h-3 w-3" />
              {new Date(task.deadline).toLocaleDateString("de-DE")}
            </div>
          )}


        </div>

        {/* Löschen-Button */}
        <button
          onClick={() => setShowConfirm(true)}
          className="text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Lösch-Bestätigung Popover */}
      {showConfirm && (
        <div className="absolute right-0 top-0 z-10 rounded-lg border bg-white p-3 shadow-lg w-48">
          <p className="text-xs mb-2">Task löschen?</p>
          <div className="flex gap-1.5">
            <Button
              size="sm"
              variant="destructive"
              className="flex-1 h-7 text-xs"
              onClick={() => { setShowConfirm(false); onDelete(task.id); }}
            >
              Löschen
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1 h-7 text-xs"
              onClick={() => setShowConfirm(false)}
            >
              Abbrechen
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
