/**
 * @arch-badge Typ
 * @arch-subtitle Datenmodell: Board + Task
 * @arch-summary Zentrale Typdefinitionen für Boards und ihre Tasks (Spalte, Zuweisung, Deadline).
 * @arch-step 3
 */
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
