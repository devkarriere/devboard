import { Plus } from "lucide-react"
import { Button } from "../../../components/ui/button"
import TaskCard from "./TaskCard"
import type { Task } from "../../../types/board.type"
import { useState } from "react"
import TaskDialog from "./TaskDialog"

/**
 * @arch-badge Komponente
 * @arch-subtitle Spalte (ToDo / Progress / Done) als Drop-Zone
 * @arch-summary Rendert alle Tasks ihrer Spalte und nimmt per HTML5-Drag-and-Drop Tasks aus anderen Spalten entgegen.
 * @arch-step 3
 */
export default function BoardColumn({
  title,
  tasks,
  onAddTask,
  onDeleteTask,
  onUpdateTaskStatus,
  handleEditTask,
}: {
  title: "ToDo" | "Progress" | "Done"
  tasks: Task[]
  onAddTask: (task: Task) => void
  onDeleteTask: (task: Task) => void
  onUpdateTaskStatus: (
    id: string,
    newColumn: "ToDo" | "Progress" | "Done"
  ) => void
  handleEditTask: (task: Task) => void
}) {
  const [isDragHover, setIsDragHover] = useState(false)
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false)
  function isTaskInTasks(column: string | null): boolean {
    return column === title.toLowerCase()
  }

  function getColumnFromDraggedItem(dataTransfer: DataTransfer): string | null {
    let column: string | null = null
    dataTransfer.types.forEach((type) => {
      if (type.startsWith("column-")) {
        column = type.replace("column-", "")
      }
    })
    return column
  }

  function getIdFromDraggedItem(dataTransfer: DataTransfer): string | null {
    let column: string | null = null
    dataTransfer.types.forEach((type) => {
      if (type.startsWith("id-")) {
        column = type.replace("id-", "")
      }
    })
    return column
  }

  function handleDragHover(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault()
    const column = getColumnFromDraggedItem(event.dataTransfer)

    if (isTaskInTasks(column)) {
      setIsDragHover(false)
    } else {
      setIsDragHover(true)
    }
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    const column = getColumnFromDraggedItem(event.dataTransfer)
    const id = getIdFromDraggedItem(event.dataTransfer) ?? ""
    if (isTaskInTasks(column)) {
      setIsDragHover(false)
    } else {
      onUpdateTaskStatus(id, title)
      setIsDragHover(false)
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
        <h3 className="font-bold">
          {title}{" "}
          <span className="ml-2 text-sm font-normal">{tasks.length}</span>
        </h3>
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
          {tasks.length === 0 && (
            <p className="text-center text-sm">Keine Tasks</p>
          )}
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
