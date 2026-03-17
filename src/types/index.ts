// Benutzer-Typ (vereinfacht – kein Login, keine Rollen)
export interface User {
  id: string;
  name: string;
}

// Eine einzelne Task auf dem Kanban-Board
export interface Task {
  id: string;
  title: string;
  description: string;
  assignedTo: string; // Name des Nutzers
  columnId: string;
}

// Eine Spalte im Kanban-Board (fest: "To Do", "In Progress", "Done")
export interface Column {
  id: string;
  title: string;
  order: number;
}

// Ein komplettes Board mit Spalten und Tasks
export interface Board {
  id: string;
  title: string;
  columns: Column[];
  tasks: Task[];
}
