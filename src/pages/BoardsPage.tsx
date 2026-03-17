import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CreateBoardDialog } from "@/components/board/CreateBoardDialog";
import { getBoards, deleteBoard } from "@/lib/storage";
import type { Board } from "@/types";

// Übersichtsseite: Zeigt alle Boards als Karten
export function BoardsPage() {
  const [boards, setBoards] = useState<Board[]>(getBoards());
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  // Boards aus dem LocalStorage neu laden
  function reload() {
    setBoards(getBoards());
  }

  // Board löschen
  function handleDelete(id: string) {
    deleteBoard(id);
    reload();
  }

  return (
    <div>
      {/* Header mit Titel und "Neues Board"-Button */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Meine Boards</h1>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Neues Board
        </Button>
      </div>

      {/* Board-Liste */}
      {boards.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg mb-2">Noch keine Boards vorhanden.</p>
          <p className="text-sm">Erstelle dein erstes Board, um loszulegen!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {boards.map((board) => (
            <Card key={board.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <Link to={`/boards/${board.id}`} className="flex-1">
                    <CardTitle className="text-lg hover:underline">
                      {board.title}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {board.columns.length} Spalten · {board.tasks.length} Tasks
                    </CardDescription>
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => handleDelete(board.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog: Neues Board erstellen */}
      <CreateBoardDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onBoardCreated={reload}
      />
    </div>
  );
}
