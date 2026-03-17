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
import { useAuth } from "@/context/AuthContext";
import { createBoard } from "@/lib/api";

interface CreateBoardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBoardCreated: () => void;
}

// Dialog zum Erstellen eines neuen Boards
export function CreateBoardDialog({
  open,
  onOpenChange,
  onBoardCreated,
}: CreateBoardDialogProps) {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !user) return;

    setLoading(true);
    await createBoard(title.trim());
    setLoading(false);
    setTitle("");
    onOpenChange(false);
    onBoardCreated();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Neues Board erstellen</DialogTitle>
          <DialogDescription>
            Gib dem Board einen Namen. Es werden automatisch drei Spalten
            angelegt.
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
            <Button type="submit" disabled={!title.trim() || loading}>
              {loading ? "Erstellen..." : "Erstellen"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
