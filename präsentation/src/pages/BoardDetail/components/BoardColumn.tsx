import { Plus } from "lucide-react"
import { Button } from "../../../components/ui/button"
import TaskCard from "./TaskCard"
import type { Task } from "../../../types/board.type"

export default function BoardColumn({
  title,
  tasks,
}: {
  title: string
  tasks: Task[]
}) {
  return (
    <div className="rounded-lg border border-black bg-gray-50">
      <div className="flex items-center justify-between border-b border-black p-4">
        <h3 className="font-bold">{title}</h3>
        <Button variant="ghost" size="icon-lg">
          <Plus />
        </Button>
      </div>
      <div className="p-4">
        {tasks.map((task) => {
          return <TaskCard task={task} />
        })}
      </div>
    </div>
  )
}
