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

interface EditColumnDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (title: string) => void;
  currentTitle: string;
}

// Dialog zum Umbenennen einer Spalte
export function EditColumnDialog({
  open,
  onOpenChange,
  onSave,
  currentTitle,
}: EditColumnDialogProps) {
  const [title, setTitle] = useState(currentTitle);

  // Titel aktualisieren, wenn sich der aktuelle Spaltenname ändert
  useEffect(() => {
    if (open) setTitle(currentTitle);
  }, [open, currentTitle]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || title.trim() === currentTitle) return;

    onSave(title.trim());
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Spalte umbenennen</DialogTitle>
          <DialogDescription>
            Gib der Spalte einen neuen Namen.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="py-4">
            <Input
              placeholder="Neuer Spalten-Name"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={!title.trim() || title.trim() === currentTitle}>
              Speichern
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
