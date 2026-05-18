/**
 * Reducer für die Liste aller Boards: Anlegen und Löschen.
 *
 * @arch-id boardsreducer
 * @arch-type state
 * @arch-title boardsReducer
 * @arch-badge Reducer
 * @arch-subtitle create | delete
 * @arch-summary Pure Funktion über Board[]. "create" erzeugt ein neues Board mit drei Default-Spalten ("To Do", "In Progress", "Done") und leerer Task-Liste. "delete" entfernt das Board mit der gegebenen ID. Wird in der BoardsPage per useReducer benutzt.
 * @arch-group state
 * @arch-step 3
 */
import type { Board } from "@/types";

export type BoardsAction =
  | { type: "create"; title: string }
  | { type: "delete"; id: string };

export function boardsReducer(state: Board[], action: BoardsAction): Board[] {
  switch (action.type) {
    case "create": {
      const newBoard: Board = {
        id: crypto.randomUUID(),
        title: action.title,
        columns: [
          { id: crypto.randomUUID(), title: "To Do", order: 0 },
          { id: crypto.randomUUID(), title: "In Progress", order: 1 },
          { id: crypto.randomUUID(), title: "Done", order: 2 },
        ],
        tasks: [],
      };
      return [...state, newBoard];
    }
    case "delete":
      return state.filter((b) => b.id !== action.id);
  }
}
