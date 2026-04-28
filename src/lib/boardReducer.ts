import type { Board, Task } from "@/types";

export type BoardAction =
  | { type: "update_title"; title: string }
  | {
      type: "add_task";
      columnId: string;
      title: string;
      description: string;
      assignedTo: string;
      deadline?: string;
    }
  | { type: "delete_task"; taskId: string }
  | {
      type: "update_task";
      taskId: string;
      updates: {
        title?: string;
        description?: string;
        assignedTo?: string;
        deadline?: string;
      };
    }
  | { type: "move_task"; taskId: string; newColumnId: string };

export function boardReducer(state: Board, action: BoardAction): Board {
  switch (action.type) {
    case "update_title":
      return { ...state, title: action.title };

    case "add_task": {
      const newTask: Task = {
        id: crypto.randomUUID(),
        title: action.title,
        description: action.description,
        assignedTo: action.assignedTo,
        columnId: action.columnId,
        deadline: action.deadline || undefined,
      };
      // Neue Task am Anfang einfügen → erscheint oben in der Spalte
      return { ...state, tasks: [newTask, ...state.tasks] };
    }

    case "delete_task":
      return {
        ...state,
        tasks: state.tasks.filter((t) => t.id !== action.taskId),
      };

    case "update_task":
      return {
        ...state,
        tasks: state.tasks.map((t) => {
          if (t.id !== action.taskId) return t;
          const { updates } = action;
          return {
            ...t,
            ...(updates.title !== undefined && { title: updates.title }),
            ...(updates.description !== undefined && {
              description: updates.description,
            }),
            ...(updates.assignedTo !== undefined && {
              assignedTo: updates.assignedTo,
            }),
            ...(updates.deadline !== undefined && {
              deadline: updates.deadline || undefined,
            }),
          };
        }),
      };

    case "move_task": {
      const task = state.tasks.find((t) => t.id === action.taskId);
      if (!task) return state;
      // Task aus aktueller Position entfernen und am Anfang einfügen → erscheint oben
      const remaining = state.tasks.filter((t) => t.id !== action.taskId);
      const moved: Task = { ...task, columnId: action.newColumnId };
      return { ...state, tasks: [moved, ...remaining] };
    }
  }
}
