import { Trash2 } from "lucide-react"
import {
  Card,
  CardAction,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card"
import { Button } from "../../../components/ui/button"
import type { Task } from "../../../types/board.type"

/**
 * @arch-badge Komponente
 * @arch-subtitle Draggable Task-Eintrag mit Edit-Klick und Loeschen-Button
 * @arch-summary Rendert Titel, Beschreibung und Deadline einer Task; setzt beim Drag-Start die Quell-Spalte in `dataTransfer`, ruft `handleEditTask` bei Klick auf.
 * @arch-step 3
 */
export default function TaskCard({
  task,
  onDeleteTask,
  handleEditTask,
}: {
  task: Task
  onDeleteTask: (task: Task) => void
  handleEditTask: (task: Task) => void
}) {
  return (
    <Card
      className="hover:cursor-pointer"
      size="sm"
      draggable={true}
      onDragStart={(e) => e.dataTransfer.setData("column", task.column)}
      onClick={() => handleEditTask(task)}
    >
      <CardHeader>
        <CardTitle>{task.title}</CardTitle>
        <CardDescription>
          {task.description}
          {task.deadline
            ? new Date(task.deadline).toLocaleDateString("de-DE")
            : ""}
        </CardDescription>
        <CardAction>
          <Button
            className="text-muted-foreground hover:text-destructive"
            variant="ghost"
            size="icon-lg"
            onClick={(e) => {
              e.stopPropagation()
              onDeleteTask(task)
            }}
          >
            <Trash2 />
          </Button>
        </CardAction>
      </CardHeader>
    </Card>
  )
}
