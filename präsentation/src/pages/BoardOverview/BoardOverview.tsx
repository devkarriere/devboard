import { useReducer, useState } from "react"
import { Button } from "../../components/ui/button"
import BoardCard from "./components/BoardCard"
import { Plus } from "lucide-react"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../components/ui/dialog"
import { Input } from "../../components/ui/input"
import { useBoardOverviewReducer } from "../../hooks/boardsOverviewReducer"
import { getBoards } from "../../lib/api"
import type { Board } from "../../types/board.type"

/**
 * @arch-badge Route /boards
 * @arch-subtitle Liste aller Boards · Container
 * @arch-summary Lädt alle Boards beim Mount aus localStorage und erlaubt das Anlegen/Löschen einzelner Boards via Reducer.
 * @arch-step 1
 */
export default function BoardOverview() {
  const [boards, boardsDispatch] = useReducer(
    useBoardOverviewReducer,
    [],
    getBoards
  )

  const [boardNameInput, setBoardNameInput] = useState("Neues Board")

  function handleAddNewBoard() {
    const newBoard: Board = {
      id: String(Math.random()),
      title: boardNameInput,
      tasks: [],
    }

    boardsDispatch({ type: "ADD", data: newBoard })
    setBoardNameInput("")
  }

  function handleDeleteBoard(id: string) {
    boardsDispatch({ type: "DELETE", data: { id: id, title: "", tasks: [] } })
  }

  return (
    <>
      <div className="flex flex-row place-content-between">
        <h1 className="text-xl font-bold">Meine Boards</h1>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="size-5" />
              Neues Board
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Neues Board erstellen</DialogTitle>
              <DialogDescription>
                Gib dem Board einen Namen. Es werden automatisch drei Spalten
                angelegt (To Do, In Progress, Done).
              </DialogDescription>
            </DialogHeader>
            <Input
              onChange={(e) => setBoardNameInput(e.target.value)}
              id="name-1"
              name="name"
              defaultValue="Neues Board"
              value={boardNameInput}
            />
            <DialogFooter>
              <DialogClose>
                <Button variant={"outline"}>Abbrechen</Button>
              </DialogClose>
              <DialogClose>
                <Button onClick={handleAddNewBoard}>Speichern</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <div className="grid grid-cols-3 gap-4 pt-4">
        {boards.map((board) => {
          return <BoardCard board={board} onDelete={handleDeleteBoard} />
        })}
      </div>
    </>
  )
}
