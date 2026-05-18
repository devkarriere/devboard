import type { Board } from "../types/board.type"
import { saveBoards } from "../lib/api"

/**
 * @arch-badge Reducer
 * @arch-subtitle Pure (state, action) → state fuer die Boards-Liste
 * @arch-summary Verwaltet ADD / DELETE auf der Liste aller Boards und persistiert das Ergebnis via `saveBoards` ins localStorage.
 * @arch-step 8
 */
type BoardsOverviewState = Board[]

type BoardsOverviewAction = {
  type: "ADD" | "DELETE"
  data: Board
}

export function useBoardOverviewReducer(
  prevState: BoardsOverviewState,
  action: BoardsOverviewAction
) {
  let newState = prevState

  switch (action.type) {
    case "ADD": {
      newState = [...prevState, action.data]
      break
    }
    case "DELETE": {
      newState = prevState.filter((board) => board.id !== action.data.id)
      break
    }

    default:
      break
  }
  saveBoards(newState)
  return newState
}
