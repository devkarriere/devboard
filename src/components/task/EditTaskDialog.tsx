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
import type { Task } from "@/types";

interface EditTaskDialogProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userName: string;
  onSave: (taskId: string, title: string, description: string, assignedTo: string, deadline?: string) => void;
}

// Dialog zum Bearbeiten einer bestehenden Task
export function EditTaskDialog({
  task,
  open,
  onOpenChange,
  onSave,
  userName,
}: EditTaskDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [assignedTo, setAssignedTo] = useState("");

  // Felder mit den aktuellen Task-Daten befüllen, wenn der Dialog geöffnet wird
  useEffect(() => {
    if (task && open) {
      setTitle(task.title);
      setDescription(task.description);
      setDeadline(task.deadline ?? "");
      setAssignedTo(task.assignedTo ?? "");
    }
  }, [task, open]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!task || !title.trim()) return;

    onSave(task.id, title.trim(), description.trim(), assignedTo, deadline || undefined);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Task bearbeiten</DialogTitle>
          <DialogDescription>
            Ändere die Details dieser Aufgabe.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Titel</label>
            <Input
              placeholder="Task-Titel"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Beschreibung</label>
            <Textarea
              placeholder="Was soll erledigt werden?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[350px]"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Zugewiesen an</label>
            <select
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="">Niemand</option>
              <option value={userName}>{userName}</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Deadline</label>
            <Input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
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
      </DialogContent>
    </Dialog>
  );
}
