import type { Board } from "../types/board.type"
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
  return boards
}

export function getBoardsFromLocalstorage(): Board[] {
  const boardsStringified = localStorage.getItem(LOCAL_STORAGE_BOARDS_KEY) ?? ""
  if (boardsStringified) {
    const boards: Board[] = JSON.parse(boardsStringified) ?? []
    return boards
  }
  return []
}

export function getBoardById(id: string): Board | undefined {
  const boards = getBoards()
  return boards.find((board) => board.id === id)
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

  return data
}
