import { useEffect, useReducer, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Pencil, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BoardView } from "@/components/board/BoardView";
import { getBoard, saveBoard } from "@/lib/storage";
import { boardReducer } from "@/lib/boardReducer";
import type { Board } from "@/types";

// Detailseite eines Boards – zeigt das Kanban-Board
export function BoardDetailPage() {
  const { id } = useParams<{ id: string }>();
  const initial = id ? getBoard(id) : undefined;

  // Fehlerfall: Board nicht gefunden – früh raus, damit der innere Reducer
  // immer einen gültigen Board-State hat
  if (!initial) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-muted-foreground mb-4">Board nicht gefunden.</p>
        <Button asChild variant="outline">
          <Link to="/boards">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zurück zur Übersicht
          </Link>
        </Button>
      </div>
    );
  }

  return <BoardDetail initial={initial} />;
}

function BoardDetail({ initial }: { initial: Board }) {
  const [board, dispatch] = useReducer(boardReducer, initial);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");

  // State nach jeder Änderung in den LocalStorage spiegeln
  useEffect(() => {
    saveBoard(board);
  }, [board]);

  function startEditing() {
    setEditTitle(board.title);
    setIsEditing(true);
  }

  function saveTitle() {
    if (!editTitle.trim()) return;
    dispatch({ type: "update_title", title: editTitle.trim() });
    setIsEditing(false);
  }

  function cancelEditing() {
    setIsEditing(false);
  }

  return (
    <div>
      {/* Header mit Zurück-Button und Board-Titel */}
      <div className="flex items-center gap-4 mb-6">
        <Button asChild variant="ghost" size="icon">
          <Link to="/boards">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>

        {isEditing ? (
          <form
            onSubmit={(e) => { e.preventDefault(); saveTitle(); }}
            className="flex items-center gap-2"
          >
            <Input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="text-2xl font-bold h-10 w-64"
              autoFocus
            />
            <Button type="submit" variant="ghost" size="icon" disabled={!editTitle.trim()}>
              <Check className="h-4 w-4" />
            </Button>
            <Button type="button" variant="ghost" size="icon" onClick={cancelEditing}>
              <X className="h-4 w-4" />
            </Button>
          </form>
        ) : (
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{board.title}</h1>
            <Button
              variant="ghost"
              size="icon"
              onClick={startEditing}
            >
              <Pencil className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Kanban-Ansicht */}
      <BoardView board={board} dispatch={dispatch} />
    </div>
  );
}
