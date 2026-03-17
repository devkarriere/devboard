import { supabase } from "./supabase";
import type { Board, Column, Task, TaskLog } from "@/types";

// Basis-URL des NestJS-Backends
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

// Holt den aktuellen Supabase JWT-Token für die Authentifizierung
async function getToken(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token || "";
}

// Zentrale Fetch-Funktion: Sendet den Token als Authorization-Header mit
async function apiFetch(path: string, options: RequestInit = {}) {
  const token = await getToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(error.message || "API-Fehler");
  }

  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

// MongoDB-Board in unser Frontend-Format umwandeln (_id → id)
function mapBoard(raw: any): Board {
  return {
    id: raw._id,
    title: raw.title,
    ownerId: raw.ownerId,
    columns: (raw.columns ?? []).map((c: any) => ({
      id: c.id,
      title: c.title,
      order: c.order,
    })),
    tasks: (raw.tasks ?? []).map((t: any) => ({
      id: t.id,
      title: t.title,
      description: t.description ?? "",
      assignedTo: t.assignedTo ?? "",
      columnId: t.columnId,
      order: t.order,
    })),
  };
}

// --- Boards ---

// Alle sichtbaren Boards laden
export async function getBoards(): Promise<Board[]> {
  try {
    const data = await apiFetch("/boards");
    return (data ?? []).map(mapBoard);
  } catch (err) {
    console.error("Fehler beim Laden der Boards:", err);
    return [];
  }
}

// Ein Board mit Spalten und Tasks laden
export async function getBoard(id: string): Promise<Board | undefined> {
  try {
    const data = await apiFetch(`/boards/${id}`);
    return data ? mapBoard(data) : undefined;
  } catch {
    return undefined;
  }
}

// Neues Board erstellen
export async function createBoard(title: string): Promise<void> {
  await apiFetch("/boards", {
    method: "POST",
    body: JSON.stringify({ title }),
  });
}

// Board löschen
export async function deleteBoard(id: string): Promise<void> {
  await apiFetch(`/boards/${id}`, { method: "DELETE" });
}

// --- Spalten ---

// Neue Spalte hinzufügen
export async function addColumn(boardId: string, title: string): Promise<Column> {
  const data = await apiFetch(`/boards/${boardId}/columns`, {
    method: "POST",
    body: JSON.stringify({ title }),
  });
  return { id: data.id, title: data.title, order: data.order };
}

// Spalte umbenennen oder verschieben
export async function updateColumn(
  boardId: string,
  columnId: string,
  updates: { title?: string; order?: number }
): Promise<void> {
  await apiFetch(`/boards/${boardId}/columns/${columnId}`, {
    method: "PATCH",
    body: JSON.stringify(updates),
  });
}

// Spalte löschen
export async function deleteColumn(boardId: string, columnId: string): Promise<void> {
  await apiFetch(`/boards/${boardId}/columns/${columnId}`, {
    method: "DELETE",
  });
}

// --- Tasks ---

// Neue Task erstellen
export async function addTask(
  boardId: string,
  columnId: string,
  title: string,
  description: string,
  assignedTo: string
): Promise<Task> {
  const data = await apiFetch(`/boards/${boardId}/tasks`, {
    method: "POST",
    body: JSON.stringify({ columnId, title, description, assignedTo }),
  });
  return {
    id: data.id,
    title: data.title,
    description: data.description ?? "",
    assignedTo: data.assignedTo ?? "",
    columnId: data.columnId,
    order: data.order,
  };
}

// Task löschen
export async function deleteTask(boardId: string, taskId: string): Promise<void> {
  await apiFetch(`/boards/${boardId}/tasks/${taskId}`, {
    method: "DELETE",
  });
}

// Task aktualisieren (Spalte, Reihenfolge oder Inhalt ändern)
export async function updateTask(
  boardId: string,
  taskId: string,
  updates: {
    columnId?: string;
    order?: number;
    title?: string;
    description?: string;
    assignedTo?: string;
  }
): Promise<void> {
  await apiFetch(`/boards/${boardId}/tasks/${taskId}`, {
    method: "PATCH",
    body: JSON.stringify(updates),
  });
}

// --- Task Logs ---

// Änderungshistorie einer Task laden
export async function getTaskLogs(boardId: string, taskId: string): Promise<TaskLog[]> {
  try {
    const data = await apiFetch(`/boards/${boardId}/tasks/${taskId}/logs`);
    return data ?? [];
  } catch {
    return [];
  }
}

// --- Mitglieder ---

// Alle registrierten User laden (für die Zuweisung von Tasks)
export async function getAllProfiles(): Promise<{ id: string; name: string }[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, name")
    .order("name");

  if (error || !data) return [];
  return data.map((p) => ({ id: p.id, name: p.name }));
}
