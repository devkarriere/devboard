import { saveBoard } from "../lib/api"
import type { Board, Task } from "../types/board.type"

/**
 * @arch-badge Reducer
 * @arch-subtitle Pure (state, action) → state fuer ein Board + Persistenz
 * @arch-summary Verwaltet UPDATE_BOARD_NAME / ADD_TASK / DELETE_TASK / UPDATE_TASK und persistiert nach jeder Mutation via `saveBoard` ins localStorage.
 * @arch-step 9
 */
type BoardDetailAction =
  | {
      type: "UPDATE_BOARD_NAME"
      data: string
    }
  | {
      type: "ADD_TASK" | "DELETE_TASK" | "UPDATE_TASK"
      data: Task
    }

export function useBoardDetailReducer(
  prevState: Board,
  action: BoardDetailAction
) {
  let newState = prevState

  switch (action.type) {
    case "UPDATE_BOARD_NAME": {
      newState = {
        ...prevState,
        title: action.data,
      }
      break
    }
    case "ADD_TASK": {
      newState = { ...prevState }
      const newTasks = [...prevState.tasks, action.data]
      newState.tasks = newTasks
      break
    }
    case "DELETE_TASK": {
      newState = { ...prevState }
      const newTasks = prevState.tasks.filter(
        (task) => task.id !== action.data.id
      )
      newState.tasks = newTasks
      break
    }
    case "UPDATE_TASK": {
      newState = { ...prevState }
      const updateTasks = prevState.tasks.map((task) => {
        if (task.id === action.data.id) {
          return action.data
        } else {
          return task
        }
      })
      newState.tasks = updateTasks
      break
    }
  }
  saveBoard(newState)
  return newState
}
