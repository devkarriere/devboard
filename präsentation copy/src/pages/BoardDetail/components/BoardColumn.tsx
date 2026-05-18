import { Plus } from "lucide-react"
import { Button } from "../../../components/ui/button"
import TaskCard from "./TaskCard"
import type { Task } from "../../../types/board.type"
import { useState } from "react"
import TaskDialog from "./TaskDialog"

/**
 * @arch-badge Komponente
 * @arch-subtitle Eine Spalte (ToDo / Progress / Done) mit Drop-Zone + Add-Dialog
 * @arch-summary Rendert alle Tasks der Spalte, oeffnet den `TaskDialog` zum Anlegen und reagiert ueber `onDragEnter`/`onDrop` auf gezogene Karten.
 * @arch-step 3
 */
export default function BoardColumn({
  title,
  tasks,
  onAddTask,
  onDeleteTask,
  handleEditTask,
}: {
  title: "ToDo" | "Progress" | "Done"
  tasks: Task[]
  onAddTask: (task: Task) => void
  onDeleteTask: (task: Task) => void
  handleEditTask: (task: Task) => void
}) {
  const [isDragHover, setIsDragHover] = useState(false)
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false)
  function isTaskInTasks(column: string): boolean {
    return column === title
  }

  function handleDragHover(event: React.DragEvent<HTMLDivElement>) {
    const column = event.dataTransfer.getData("column")
    console.log(column)
    if (isTaskInTasks(column)) {
      setIsDragHover(false)
    } else {
      setIsDragHover(true)
    }
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    const column = event.dataTransfer.getData("column")
    if (isTaskInTasks(column)) {
      setIsDragHover(false)
    } else {
      //CALL FUNCTION TO MOVE TASK TO THIS COLUMN
    }
  }

  function getRandomId() {
    return String(Math.random())
  }

  return (
    <div
      className={`rounded-lg border border-black bg-gray-50 ${isDragHover && "border-1 border-primary"}`}
      onDrop={handleDrop}
      onDragEnter={handleDragHover}
      onDragOver={handleDragHover}
      onDragLeave={() => {
        setIsDragHover(false)
      }}
    >
      <div className="flex items-center justify-between border-b border-black p-4">
        <h3 className="font-bold">{title}</h3>
        <Button
          variant="ghost"
          size="icon-lg"
          onClick={() => setIsTaskDialogOpen(true)}
        >
          <Plus />
        </Button>
        <TaskDialog
          open={isTaskDialogOpen}
          handleOpenChange={setIsTaskDialogOpen}
          onSubmitUpdate={onAddTask}
          title="Neue Task erstellen"
          description="Erstelle eine neue Aufgabe für diese Spalte."
          task={{
            id: getRandomId(),
            title: "",
            description: "",
            column: title,
            deadline: "",
          }}
        />
      </div>
      <div className="p-4">
        <div
          className={`rounded-lg border-2 border-dashed border-primary bg-primary/10 p-2 text-center text-primary ${!isDragHover && "hidden"}`}
        >
          Hier ablegen
        </div>
        <div className="flex flex-col gap-4">
          {tasks.map((task) => {
            return (
              <TaskCard
                onDeleteTask={onDeleteTask}
                task={task}
                handleEditTask={handleEditTask}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}
