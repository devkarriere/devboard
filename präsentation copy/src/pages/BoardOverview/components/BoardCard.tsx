import { Trash2 } from "lucide-react"
import { Button } from "../../../components/ui/button"
import {
  Card,
  CardAction,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card"
import { Link } from "react-router-dom"
import type { Board } from "../../../types/board.type"

/**
 * @arch-badge Komponente
 * @arch-subtitle Klickbarer Board-Eintrag in der Boards-Uebersicht
 * @arch-summary Rendert eine Karte mit Board-Titel, Task-Anzahl, Loeschen-Button und verlinkt auf `/boards/:id`.
 * @arch-step 2
 */
export default function BoardCard({
  board,
  onDelete,
}: {
  board: Board
  onDelete: (id: string) => void
}) {
  return (
    <Link to={`/boards/${board.id}`}>
      <Card className="transition-shadow hover:shadow-md">
        <CardHeader>
          <CardTitle>{board.title}</CardTitle>
          <CardDescription>
            3 Spalten - {board.tasks.length} Tasks
          </CardDescription>
          <CardAction>
            <Button
              onClick={(e) => {
                e.preventDefault()
                onDelete(board.id)
              }}
              className="text-muted-foreground hover:text-destructive"
              size="icon"
              variant="ghost"
            >
              <Trash2 />
            </Button>
          </CardAction>
        </CardHeader>
      </Card>
    </Link>
  )
}
