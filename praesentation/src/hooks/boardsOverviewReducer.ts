/** @arch-step 8 */
import type { Board } from "../types/board.type"
import { saveBoards } from "../lib/api"

type BoardsOverviewState = Board[]

type BoardsOverviewAction = {
  type: "ADD" | "DELETE"
  data: Board
}

/**
 * @arch-badge Reducer
 * @arch-subtitle Pure (state, action) → state für Board-Liste
 * @arch-summary Verwaltet ADD und DELETE auf der Board-Sammlung und persistiert nach localStorage.
 * @arch-step 8
 */
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
