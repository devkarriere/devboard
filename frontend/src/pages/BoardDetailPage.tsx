import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, LayoutGrid, Table } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BoardView } from "@/components/board/BoardView";
import { TableView } from "@/components/board/TableView";
import { getBoard } from "@/lib/api";
import type { Board } from "@/types";

// Detailseite eines Boards – zeigt das Kanban-Board oder die Tabellenansicht
export function BoardDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [board, setBoard] = useState<Board | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"kanban" | "table">("kanban");

  // Board laden. Loading nur beim ersten Mal anzeigen,
  // damit das Board bei Änderungen (Drag & Drop etc.) nicht flackert.
  async function loadBoard() {
    if (!id) return;
    const loaded = await getBoard(id);
    setBoard(loaded ?? null);
    setLoading(false);
  }

  useEffect(() => {
    loadBoard();
  }, [id]);

  if (loading) {
    return (
      <div className="text-center py-12 text-muted-foreground">Board wird geladen...</div>
    );
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
      {/* Header mit Zurück-Button, Board-Titel und Ansichts-Toggle */}
      <div className="flex items-center gap-4 mb-6">
        <Button asChild variant="ghost" size="icon">
          <Link to="/boards">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">{board.title}</h1>

        {/* Toggle: Kanban / Tabelle */}
        <div className="ml-auto flex gap-1">
          <Button
            variant={viewMode === "kanban" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("kanban")}
          >
            <LayoutGrid className="h-4 w-4 mr-1" />
            Kanban
          </Button>
          <Button
            variant={viewMode === "table" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("table")}
          >
            <Table className="h-4 w-4 mr-1" />
            Tabelle
          </Button>
        </div>
      </div>

      {/* Ansicht je nach Toggle */}
      {viewMode === "kanban" ? (
        <BoardView board={board} onBoardChange={loadBoard} />
      ) : (
        <TableView board={board} onBoardChange={loadBoard} />
      )}
    </div>
  );
}
