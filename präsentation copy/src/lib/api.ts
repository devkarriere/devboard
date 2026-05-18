import type { Board } from "../types/board.type"

const LOCAL_STORAGE_BOARDS_KEY = "boards"

/**
 * @arch-badge Persistenz
 * @arch-subtitle localStorage als Datenbank-Ersatz fuer alle Boards
 * @arch-summary Sammelt alle Boards/Save/Load-Funktionen an einer Stelle - serialisiert Boards als JSON unter dem Key `boards`.
 */
export function getBoards(): Board[] {
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
