import { Calendar, CircleUser, Trash2 } from "lucide-react"
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
 * @arch-subtitle Draggable Task-Kachel
 * @arch-summary Zeigt Titel, Beschreibung, Zuweisung und Deadline einer Task; Click öffnet den Edit-Dialog, Drag startet den Spaltenwechsel.
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
      onDragStart={(e) => {
        e.dataTransfer.setData(`column-${task.column}`, "")
        e.dataTransfer.setData(`id-${task.id}`, "")
      }}
      onClick={() => handleEditTask(task)}
    >
      <CardHeader>
        <CardTitle>{task.title}</CardTitle>
        <CardDescription className="flex flex-col">
          {task.description && <span>{task.description}</span>}
          {task.assignedTo && (
            <span className="flex items-center gap-1">
              <CircleUser className="size-3" />
              {task.assignedTo}
            </span>
          )}
          {task.deadline && (
            <span className="flex items-center gap-1">
              <Calendar className="size-3" />
              {new Date(task.deadline ?? new Date()).toLocaleDateString(
                "de-DE"
              )}
            </span>
          )}
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
