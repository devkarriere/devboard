import { supabase } from "./supabase";
import type { Board, Column, Task } from "@/types";

// --- Boards ---

// Alle Boards laden (RLS filtert automatisch nach Berechtigung)
export async function getBoards(): Promise<Board[]> {
  const { data: boards, error } = await supabase
    .from("boards")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Fehler beim Laden der Boards:", error.message);
    return [];
  }
  if (!boards) return [];

  // Für jedes Board die Spalten und Tasks nachladen
  const fullBoards: Board[] = [];
  for (const board of boards) {
    const full = await getBoard(board.id);
    if (full) fullBoards.push(full);
  }
  return fullBoards;
}

// Ein einzelnes Board mit Spalten und Tasks laden
export async function getBoard(id: string): Promise<Board | undefined> {
  const { data: board, error: boardError } = await supabase
    .from("boards")
    .select("*")
    .eq("id", id)
    .single();

  if (boardError || !board) return undefined;

  // Spalten laden
  const { data: columns } = await supabase
    .from("columns")
    .select("*")
    .eq("board_id", id)
    .order("order");

  // Tasks laden (über die Spalten-IDs)
  const columnIds = (columns ?? []).map((c) => c.id);
  let tasks: Task[] = [];
  if (columnIds.length > 0) {
    const { data: taskData } = await supabase
      .from("tasks")
      .select("*")
      .in("column_id", columnIds)
      .order("order");
    tasks = (taskData ?? []).map((t) => ({
      id: t.id,
      title: t.title,
      description: t.description ?? "",
      assignedTo: t.assigned_to ?? "",
      columnId: t.column_id,
      order: t.order,
    }));
  }

  // Board-Mitglieder laden
  const { data: members } = await supabase
    .from("board_members")
    .select("user_id")
    .eq("board_id", id);

  return {
    id: board.id,
    title: board.title,
    ownerId: board.owner_id,
    members: (members ?? []).map((m) => m.user_id),
    columns: (columns ?? []).map((c) => ({
      id: c.id,
      title: c.title,
      order: c.order,
    })),
    tasks,
  };
}

// Neues Board mit Standard-Spalten erstellen
export async function createBoard(title: string, ownerId: string): Promise<void> {
  // Board erstellen
  const { data: board, error: boardError } = await supabase
    .from("boards")
    .insert({ title, owner_id: ownerId })
    .select()
    .single();

  if (boardError || !board) throw boardError;

  // Owner als Member hinzufügen
  await supabase
    .from("board_members")
    .insert({ board_id: board.id, user_id: ownerId });

  // Standard-Spalten erstellen
  await supabase.from("columns").insert([
    { board_id: board.id, title: "To Do", order: 0 },
    { board_id: board.id, title: "In Progress", order: 1 },
    { board_id: board.id, title: "Done", order: 2 },
  ]);
}

// Board löschen
export async function deleteBoard(id: string): Promise<void> {
  const { error } = await supabase.from("boards").delete().eq("id", id);
  if (error) throw error;
}

// --- Mitglieder ---

// Profil-Daten der Board-Mitglieder laden (für Dropdown-Auswahl)
export async function getBoardMemberProfiles(
  memberIds: string[]
): Promise<{ id: string; name: string }[]> {
  if (memberIds.length === 0) return [];
  const { data, error } = await supabase
    .from("profiles")
    .select("id, name")
    .in("id", memberIds);

  if (error || !data) return [];
  return data.map((p) => ({ id: p.id, name: p.name }));
}

// --- Spalten ---

// Neue Spalte zu einem Board hinzufügen
export async function addColumn(boardId: string, title: string, order: number): Promise<Column> {
  const { data, error } = await supabase
    .from("columns")
    .insert({ board_id: boardId, title, order })
    .select()
    .single();

  if (error || !data) throw error;
  return { id: data.id, title: data.title, order: data.order };
}

// Spalte löschen (Tasks werden durch CASCADE automatisch gelöscht)
export async function deleteColumn(columnId: string): Promise<void> {
  const { error } = await supabase.from("columns").delete().eq("id", columnId);
  if (error) throw error;
}

// --- Tasks ---

// Neue Task erstellen
export async function addTask(
  columnId: string,
  title: string,
  description: string,
  assignedTo: string,
  order: number
): Promise<Task> {
  const { data, error } = await supabase
    .from("tasks")
    .insert({
      column_id: columnId,
      title,
      description,
      assigned_to: assignedTo,
      order,
    })
    .select()
    .single();

  if (error || !data) throw error;
  return {
    id: data.id,
    title: data.title,
    description: data.description ?? "",
    assignedTo: data.assigned_to ?? "",
    columnId: data.column_id,
    order: data.order,
  };
}

// Task löschen
export async function deleteTask(taskId: string): Promise<void> {
  const { error } = await supabase.from("tasks").delete().eq("id", taskId);
  if (error) throw error;
}

// Task aktualisieren (Spalte, Reihenfolge, oder Inhalt ändern)
export async function updateTask(
  taskId: string,
  updates: { column_id?: string; order?: number; title?: string; description?: string; assigned_to?: string }
): Promise<void> {
  const { error } = await supabase.from("tasks").update(updates).eq("id", taskId);
  if (error) throw error;
}
