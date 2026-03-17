import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { History } from "lucide-react";
import { getTaskLogs } from "@/lib/api";
import type { Task, TaskLog } from "@/types";

interface EditTaskDialogProps {
  task: Task | null;
  boardId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (taskId: string, title: string, description: string, assignedTo: string) => void;
  members: { id: string; name: string }[];
}

// Dialog zum Bearbeiten einer bestehenden Task
export function EditTaskDialog({
  task,
  boardId,
  open,
  onOpenChange,
  onSave,
  members,
}: EditTaskDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [logs, setLogs] = useState<TaskLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  // Felder mit den aktuellen Task-Daten befüllen, wenn der Dialog geöffnet wird
  useEffect(() => {
    if (task && open) {
      setTitle(task.title);
      setDescription(task.description);
      setAssignedTo(task.assignedTo);

      // Änderungshistorie laden
      setLogsLoading(true);
      getTaskLogs(boardId, task.id).then((data) => {
        setLogs(data);
        setLogsLoading(false);
      });
    } else {
      setLogs([]);
    }
  }, [task, open, boardId]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!task || !title.trim()) return;

    onSave(task.id, title.trim(), description.trim(), assignedTo.trim());
    onOpenChange(false);
  }

  // Datum formatieren: "28.02.2026, 14:30"
  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[50vh] max-w-3xl overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Task bearbeiten</DialogTitle>
          <DialogDescription>
            Ändere die Details dieser Aufgabe.
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-6 min-h-0 flex-1">
          {/* Linke Seite: Formular */}
          <form onSubmit={handleSubmit} className="space-y-4 flex-1 min-w-0 flex flex-col min-h-0">
            <div>
              <label className="text-sm font-medium mb-1 block">Titel</label>
              <Input
                placeholder="Task-Titel"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoFocus
              />
            </div>
            <div className="flex-1 min-h-0 flex flex-col">
              <label className="text-sm font-medium mb-1 block">Beschreibung</label>
              <Textarea
                placeholder="Was soll erledigt werden?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="flex-1 min-h-0 resize-none"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Zugewiesen an</label>
              <select
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {members.map((member) => (
                  <option key={member.id} value={member.name}>
                    {member.name}
                  </option>
                ))}
              </select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Abbrechen
              </Button>
              <Button type="submit" disabled={!title.trim()}>
                Speichern
              </Button>
            </DialogFooter>
          </form>

          {/* Rechte Seite: Änderungshistorie */}
          <div className="w-64 border-l pl-6 overflow-y-auto min-h-0">
            <h4 className="text-sm font-medium flex items-center gap-2 mb-3">
              <History className="h-4 w-4" />
              Änderungshistorie
            </h4>
            {logsLoading ? (
              <p className="text-xs text-muted-foreground">Wird geladen...</p>
            ) : logs.length === 0 ? (
              <p className="text-xs text-muted-foreground">Keine Änderungen vorhanden.</p>
            ) : (
              <ul className="space-y-2">
                {logs.map((log) => (
                  <li key={log._id} className="text-xs border-l-2 border-muted pl-3 py-1">
                    <p className="text-foreground">{log.message}</p>
                    <p className="text-muted-foreground mt-0.5">
                      {formatDate(log.createdAt)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
