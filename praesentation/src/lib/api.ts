import type {
  Board,
  CreateTask,
  Task,
  UpdateBoard,
  UpdateTask,
} from "../types/board.type"
import type { Profile } from "../types/profile.type"
import supabase from "./db"

const LOCAL_STORAGE_BOARDS_KEY = "boards"

/**
 * @arch-badge Persistenz
 * @arch-subtitle localStorage-Adapter für Boards
 * @arch-summary Liest, speichert und aktualisiert die Board-Sammlung im Browser-localStorage als JSON.
 */
export async function getBoards(): Promise<Board[]> {
  const { data: boards, error } = await supabase
    .from("boards")
    .select("*, tasks(*)")
  if (error) {
    console.error("Error fetching boards:", error)
    return []
  }
  return boards as Board[]
}

export function getBoardsFromLocalstorage(): Board[] {
  const boardsStringified = localStorage.getItem(LOCAL_STORAGE_BOARDS_KEY) ?? ""
  if (boardsStringified) {
    const boards: Board[] = JSON.parse(boardsStringified) ?? []
    return boards
  }
  return []
}

export async function getBoardById(id: string): Promise<Board | undefined> {
  const { data: board, error } = await supabase
    .from("boards")
    .select("*, tasks(assignedTo:profiles(username, id), *)")
    .eq("id", id)
    .single()

  if (error) {
    console.error("Error fetching board by id:", error)
    return undefined
  }

  console.log("Fetched board:", board)

  return board as Board
}

export function saveBoards(boards: Board[]): void {
  localStorage.setItem(LOCAL_STORAGE_BOARDS_KEY, JSON.stringify(boards))
}

export function saveBoard(board: Board): void {
  const boards = getBoards()

  const updatedBoards = boards.map((b) => {
    if (b.id === board.id) {
      return board
    } else {
      return b
    }
  })
  saveBoards(updatedBoards)
}

export async function deleteBoard(id: string): Promise<void> {
  const { error } = await supabase.from("boards").delete().eq("id", id)
  if (error) {
    console.error("Error deleting board:", error)
    throw error
  }
}

export async function insertBoard(board: Board): Promise<Board | null> {
  const { data, error } = await supabase
    .from("boards")
    .insert({ title: board.title, created_at: board.created_at })
    .select("*, tasks(*)")
    .single()

  if (error) {
    console.error("Error inserting board:", error)
    return null
  }

  return data as Board
}

export async function updateBoard(
  id: string,
  board: UpdateBoard
): Promise<Board | null> {
  const { data, error } = await supabase
    .from("boards")
    .update(board)
    .eq("id", id)
    .select("*, tasks(*)")
    .single()

  if (error) {
    console.error("Error updating board:", error)
    return null
  }

  return data as Board
}

export async function insertTask(task: CreateTask): Promise<Task | null> {
  const { data, error } = await supabase
    .from("tasks")
    .insert(task)
    .select("*")
    .single()

  if (error) {
    console.error("Error inserting task:", error)
    throw error
  }

  return data as Task
}

export async function updateTask(
  id: string,
  task: UpdateTask
): Promise<Task | null> {
  const { data, error } = await supabase
    .from("tasks")
    .update(task)
    .eq("id", id)
    .select("*")
    .single()

  if (error) {
    console.error("Error updating task:", error)
    throw error
  }

  return data as Task
}

export async function deleteTask(id: string): Promise<void> {
  const { error } = await supabase.from("tasks").delete().eq("id", id)
  if (error) {
    console.error("Error deleting task:", error)
    throw error
  }
}

export async function getProfileById(id: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .single()

  if (error) {
    console.error("Error fetching profile by id:", error)
    return null
  }

  return data
}

export async function getProfiles(): Promise<Profile[]> {
  const { data, error } = await supabase.from("profiles").select("*")

  if (error) {
    console.error("Error fetching profiles: ", error)
    return []
  }

  return data
}

export async function updateProfile(
  id: string,
  username: string
): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .update({ username: username })
    .eq("id", id)
    .select("*")
    .single()

  if (error) {
    console.error("Error updating profile:", error)
    throw error
  }

  return data
}
