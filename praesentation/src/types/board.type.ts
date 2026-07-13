import type { Database } from "./supabase"

/**
 * @arch-badge Typ
 * @arch-subtitle Datenmodell: Board + Task
 * @arch-summary Zentrale Typdefinitionen für Boards und ihre Tasks (Spalte, Zuweisung, Deadline).
 * @arch-step 3
 */
export interface BoardLocalstorage {
  id: string
  title: string
  tasks: Task[]
}

export type UpdateBoard = Database["public"]["Tables"]["boards"]["Update"]

export type Board = Database["public"]["Tables"]["boards"]["Row"] & {
  tasks: Task[]
}

export type Task = Database["public"]["Tables"]["tasks"]["Row"] & {
  column: "ToDo" | "Progress" | "Done"
  assignedTo?: { username: string; id: string } | null
}

export type UpdateTask = Database["public"]["Tables"]["tasks"]["Update"]

export type CreateTask = Database["public"]["Tables"]["tasks"]["Insert"]

// export interface Task {
//   id: string
//   title: string
//   column: "ToDo" | "Progress" | "Done"
//   assignedTo?: string
//   description?: string
//   deadline?: string
// }
