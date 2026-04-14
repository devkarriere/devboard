import type { Board, Task } from "@/types";

// Key für den LocalStorage
const STORAGE_KEY = "kanban-data";

export function getUserName() {
  return localStorage.getItem("kanban-user-name") || "Nutzer";
}

// Alle Boards aus dem LocalStorage laden
function loadBoards(): Board[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

// Alle Boards im LocalStorage speichern
function saveBoards(boards: Board[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(boards));
}

// --- Boards ---

// Alle Boards laden
export function getBoards(): Board[] {
  return loadBoards();
}

// Ein einzelnes Board laden
export function getBoard(id: string): Board | undefined {
  return loadBoards().find((b) => b.id === id);
}

// Neues Board mit den drei festen Spalten erstellen
export function createBoard(title: string): void {
  const boards = loadBoards();
  const newBoard: Board = {
    id: crypto.randomUUID(),
    title,
    columns: [
      { id: crypto.randomUUID(), title: "To Do", order: 0 },
      { id: crypto.randomUUID(), title: "In Progress", order: 1 },
      { id: crypto.randomUUID(), title: "Done", order: 2 },
    ],
    tasks: [],
  };
  boards.push(newBoard);
  saveBoards(boards);
}

// Board-Titel aktualisieren
export function updateBoard(id: string, updates: { title?: string }): void {
  const boards = loadBoards();
  const board = boards.find((b) => b.id === id);
  if (!board) return;

  if (updates.title !== undefined) board.title = updates.title;
  saveBoards(boards);
}

// Board löschen
export function deleteBoard(id: string): void {
  const boards = loadBoards().filter((b) => b.id !== id);
  saveBoards(boards);
}

// --- Tasks ---

// Neue Task erstellen
export function addTask(
  boardId: string,
  columnId: string,
  title: string,
  description: string,
  assignedTo: string,
): Task {
  const boards = loadBoards();
  const board = boards.find((b) => b.id === boardId);
  if (!board) throw new Error("Board nicht gefunden");

  const newTask: Task = {
    id: crypto.randomUUID(),
    title,
    description,
    assignedTo,
    columnId,
  };
  // Neue Task am Anfang einfügen → erscheint oben in der Spalte
  board.tasks.unshift(newTask);
  saveBoards(boards);
  return newTask;
}

// Task löschen
export function deleteTask(boardId: string, taskId: string): void {
  const boards = loadBoards();
  const board = boards.find((b) => b.id === boardId);
  if (!board) return;

  board.tasks = board.tasks.filter((t) => t.id !== taskId);
  saveBoards(boards);
}

// Task aktualisieren (Titel, Beschreibung)
export function updateTask(
  boardId: string,
  taskId: string,
  updates: { title?: string; description?: string; assignedTo?: string; deadline?: string },
): void {
  const boards = loadBoards();
  const board = boards.find((b) => b.id === boardId);
  if (!board) return;

  const task = board.tasks.find((t) => t.id === taskId);
  if (!task) return;

  if (updates.title !== undefined) task.title = updates.title;
  if (updates.description !== undefined) task.description = updates.description;
  if (updates.assignedTo !== undefined) task.assignedTo = updates.assignedTo;
  if (updates.deadline !== undefined) task.deadline = updates.deadline || undefined;
  saveBoards(boards);
}

// Task in eine andere Spalte verschieben
export function moveTask(
  boardId: string,
  taskId: string,
  newColumnId: string,
): void {
  const boards = loadBoards();
  const board = boards.find((b) => b.id === boardId);
  if (!board) return;

  const taskIndex = board.tasks.findIndex((t) => t.id === taskId);
  if (taskIndex === -1) return;

  // Task aus aktueller Position entfernen und am Anfang einfügen → erscheint oben
  const [task] = board.tasks.splice(taskIndex, 1);
  task.columnId = newColumnId;
  board.tasks.unshift(task);
  saveBoards(boards);
}
