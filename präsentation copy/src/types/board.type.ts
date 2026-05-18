/**
 * @arch-badge Typ
 * @arch-subtitle Datenmodell: Board besteht aus Titel + Task-Liste
 * @arch-summary Zentrale Typdefinitionen fuer Boards und ihre Tasks - Tasks tragen ihre Spalten-Zugehoerigkeit selbst (Feld `column`).
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
  description?: string
  deadline?: string
}
