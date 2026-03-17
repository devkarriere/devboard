import { useState, useEffect } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EditTaskDialog } from "@/components/task/EditTaskDialog";
import { deleteTask, updateTask, getAllProfiles } from "@/lib/api";
import type { Board, Task } from "@/types";

interface TableViewProps {
  board: Board;
  onBoardChange: () => void;
}

// Tabellenansicht: Zeigt alle Tasks als Zeilen mit Status, Titel, Beschreibung, Zuweisung
export function TableView({ board, onBoardChange }: TableViewProps) {
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [memberProfiles, setMemberProfiles] = useState<{ id: string; name: string }[]>([]);

  // Alle User-Profile laden (für Task-Zuweisung)
  useEffect(() => {
    getAllProfiles().then(setMemberProfiles);
  }, []);

  // columnId → Spaltenname Zuordnung
  const columnMap = new Map(board.columns.map((c) => [c.id, c.title]));

  // Tasks sortiert nach Spalten-Reihenfolge, dann nach Task-Reihenfolge
  const sortedTasks = [...board.tasks].sort((a, b) => {
    const colA = board.columns.find((c) => c.id === a.columnId);
    const colB = board.columns.find((c) => c.id === b.columnId);
    const colOrderDiff = (colA?.order ?? 0) - (colB?.order ?? 0);
    if (colOrderDiff !== 0) return colOrderDiff;
    return a.order - b.order;
  });

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

  return (
    <div>
      <div className="rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left p-3 font-medium">Status</th>
              <th className="text-left p-3 font-medium">Titel</th>
              <th className="text-left p-3 font-medium">Beschreibung</th>
              <th className="text-left p-3 font-medium">Zugewiesen an</th>
              <th className="text-right p-3 font-medium">Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {sortedTasks.map((task) => (
              <tr key={task.id} className="border-b last:border-0 hover:bg-muted/30">
                <td className="p-3">
                  <span className="inline-block rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
                    {columnMap.get(task.columnId) ?? "–"}
                  </span>
                </td>
                <td className="p-3 font-medium">{task.title}</td>
                <td className="p-3 text-muted-foreground truncate max-w-xs">
                  {task.description || "–"}
                </td>
                <td className="p-3">{task.assignedTo || "–"}</td>
                <td className="p-3 text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => setEditingTask(task)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDeleteTask(task.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {sortedTasks.length === 0 && (
              <tr>
                <td colSpan={5} className="p-6 text-center text-muted-foreground">
                  Keine Tasks vorhanden.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

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
