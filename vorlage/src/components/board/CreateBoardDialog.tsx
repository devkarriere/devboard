/**
 * Modaler Dialog zum Anlegen eines neuen Boards.
 *
 * @arch-id createboarddialog
 * @arch-type component
 * @arch-title CreateBoardDialog
 * @arch-badge Dialog
 * @arch-subtitle Titel-Input → onCreate(title)
 * @arch-summary Eingabe-Dialog für den Board-Namen. Bei Submit ruft er onCreate auf (Parent dispatched dann den boardsReducer "create"-Branch, der automatisch drei Default-Spalten anlegt).
 * @arch-group core
 * @arch-step 3
 */
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

interface CreateBoardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (title: string) => void;
}

export function CreateBoardDialog({
  open,
  onOpenChange,
  onCreate,
}: CreateBoardDialogProps) {
  const [title, setTitle] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    onCreate(title.trim());
    setTitle("");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Neues Board erstellen</DialogTitle>
          <DialogDescription>
            Gib dem Board einen Namen. Es werden automatisch drei Spalten
            angelegt (To Do, In Progress, Done).
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="py-4">
            <Input
              placeholder="Board-Name"
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
              Erstellen
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
