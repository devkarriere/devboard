import { useState, type Dispatch } from "react";
import { ColumnComponent } from "./ColumnComponent";
import { EditTaskDialog } from "@/components/task/EditTaskDialog";
import { useUserName } from "@/context/UserNameContext";
import type { BoardAction } from "@/lib/boardReducer";
import type { Board, Task } from "@/types";

interface BoardViewProps {
  board: Board;
  dispatch: Dispatch<BoardAction>;
}

// Kanban-Board-Ansicht
export function BoardView({ board, dispatch }: BoardViewProps) {
  const { userName } = useUserName();
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [draggingFromColumnId, setDraggingFromColumnId] = useState<string | null>(null);

  // Spalten nach Order sortieren
  const sortedColumns = [...board.columns].sort((a, b) => a.order - b.order);

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
            onAddTask={(columnId, title, description, assignedTo, deadline) =>
              dispatch({
                type: "add_task",
                columnId,
                title,
                description,
                assignedTo,
                deadline,
              })
            }
            onDeleteTask={(taskId) => dispatch({ type: "delete_task", taskId })}
            onEditTask={setEditingTask}
            onMoveTask={(taskId, newColumnId) =>
              dispatch({ type: "move_task", taskId, newColumnId })
            }
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
        onSave={(taskId, title, description, assignedTo, deadline) =>
          dispatch({
            type: "update_task",
            taskId,
            updates: { title, description, assignedTo, deadline: deadline ?? "" },
          })
        }
        userName={userName}
      />
    </div>
  );
}
