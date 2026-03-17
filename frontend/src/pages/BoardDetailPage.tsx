import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BoardView } from "@/components/board/BoardView";
import { getBoard } from "@/lib/storage";
import type { Board } from "@/types";

// Detailseite eines Boards – zeigt das Kanban-Board
export function BoardDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [board, setBoard] = useState<Board | null>(
    id ? getBoard(id) ?? null : null
  );

  // Board aus dem LocalStorage neu laden
  function reload() {
    if (!id) return;
    setBoard(getBoard(id) ?? null);
  }

  // Fehlerfall: Board nicht gefunden
  if (!board) {
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

  return (
    <div>
      {/* Header mit Zurück-Button und Board-Titel */}
      <div className="flex items-center gap-4 mb-6">
        <Button asChild variant="ghost" size="icon">
          <Link to="/boards">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">{board.title}</h1>
      </div>

      {/* Kanban-Ansicht */}
      <BoardView board={board} onBoardChange={reload} />
    </div>
  );
}
