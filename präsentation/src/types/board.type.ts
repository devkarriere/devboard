export interface Board {
  id: string
  title: string
  tasks: Task[]
}

export interface Task {
  id: string
  title: string
  column: "ToDo" | "Progress" | "Done"
  assignedTo?: string
  description?: string
  deadline?: string
}
