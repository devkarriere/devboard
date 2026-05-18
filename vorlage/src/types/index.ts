/**
 * Datenmodell der Anwendung: User, Task, Column, Board.
 *
 * @arch-id types
 * @arch-type type
 * @arch-title types
 * @arch-badge Typen
 * @arch-subtitle User · Task · Column · Board
 * @arch-summary Zentrale TypeScript-Typen, auf die Reducer, Storage und Komponenten gleichermaßen zugreifen. Tasks referenzieren ihre Spalte über columnId; das Board hält Spalten und Tasks getrennt, damit Verschiebe-Operationen nur das Task-Array anpassen.
 * @arch-group types
 * @arch-step 1
 */
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
  deadline?: string; // ISO-Datum (YYYY-MM-DD)
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
