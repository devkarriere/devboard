import type { Board } from "@/types";

// Key für den LocalStorage
const STORAGE_KEY = "kanban-data";

export function getUserName() {
  return localStorage.getItem("kanban-user-name") || "Nutzer";
}

// Alle Boards aus dem LocalStorage laden
export function getBoards(): Board[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

// Ein einzelnes Board laden
export function getBoard(id: string): Board | undefined {
  return getBoards().find((b) => b.id === id);
}

// Alle Boards im LocalStorage speichern
export function saveBoards(boards: Board[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(boards));
}

// Ein einzelnes Board persistieren, ohne andere Boards zu überschreiben
export function saveBoard(board: Board): void {
  const boards = getBoards();
  const idx = boards.findIndex((b) => b.id === board.id);
  if (idx === -1) boards.push(board);
  else boards[idx] = board;
  saveBoards(boards);
}
