// Rollen-Typen für die Benutzerverwaltung
export type Role = "admin" | "user";

// Benutzer-Typ
export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

// Eine einzelne Task auf dem Kanban-Board
export interface Task {
  id: string;
  title: string;
  description: string;
  assignedTo: string; // User-ID
  columnId: string;
  order: number;
}

// Eine Spalte im Kanban-Board (z.B. "To Do", "In Progress")
export interface Column {
  id: string;
  title: string;
  order: number;
}

// Ein komplettes Board mit Spalten und Tasks
export interface Board {
  id: string;
  title: string;
  ownerId: string; // User-ID
  columns: Column[];
  tasks: Task[];
}

// Ein Eintrag in der Änderungshistorie einer Task
export interface TaskLog {
  _id: string;
  taskId: string;
  boardId: string;
  userId: string;
  message: string;
  createdAt: string;
}

// Gesamter App-State, der im LocalStorage gespeichert wird
export interface KanbanData {
  boards: Board[];
  users: User[];
}
