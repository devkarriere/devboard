import { useState } from "react";
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

interface AddColumnDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (title: string) => void; // Callback mit dem Spalten-Titel
}

// Dialog zum Hinzufügen einer neuen Spalte
export function AddColumnDialog({
  open,
  onOpenChange,
  onAdd,
}: AddColumnDialogProps) {
  const [title, setTitle] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    onAdd(title.trim());
    setTitle("");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Neue Spalte hinzufügen</DialogTitle>
          <DialogDescription>
            Gib der neuen Spalte einen Namen.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="py-4">
            <Input
              placeholder="Spalten-Name (z.B. Review)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={!title.trim()}>
              Hinzufügen
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
