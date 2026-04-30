import { ArrowLeft, Check, Pencil, X } from "lucide-react"
import { Button } from "../../components/ui/button"
import { Link, useParams } from "react-router-dom"
import { useState } from "react"
import { Input } from "../../components/ui/input"
import BoardColumn from "./components/BoardColumn"
import type { Board } from "../../types/board.type"

export default function BoardDetail() {
  const { id } = useParams()
  const [isEditingBoardName, setIsEditingBoardName] = useState(false)
  const [boardName, setBoardName] = useState("Name des Boards")
  const [board, setBoard] = useState<Board>({
    id: "1",
    title: "Test",
    tasks: [
      { id: "1", title: "Abc", column: "InProgress", description: "DEF" },
    ],
  })

  function renderBoardDetailHeader() {
    if (isEditingBoardName) {
      return (
        <>
          <Input
            value={boardName}
            className="w-96"
            onChange={(event) => setBoardName(event.target.value)}
          />
          <Button
            variant="ghost"
            size="icon-lg"
            onClick={() => setIsEditingBoardName(false)}
          >
            <Check />
          </Button>
          <Button
            variant="ghost"
            size="icon-lg"
            onClick={() => setIsEditingBoardName(false)}
          >
            <X />
          </Button>
        </>
      )
    } else {
      return (
        <>
          <h1 className="text-2xl font-bold">{boardName}</h1>
          <Button
            variant="ghost"
            size="icon-lg"
            onClick={() => setIsEditingBoardName(true)}
          >
            <Pencil />
          </Button>
        </>
      )
    }
  }

  return (
    <div className="container">
      <div className="flex flex-row items-center gap-2">
        <Link to={"/boards"}>
          <Button variant="ghost" size="icon-lg">
            <ArrowLeft />
          </Button>
        </Link>
        {renderBoardDetailHeader()}
      </div>
      <div className="mt-8 grid grid-cols-3 gap-4">
        <BoardColumn
          title="ToDo"
          tasks={board.tasks.filter((task) => task.column === "ToDo")}
        />
        <BoardColumn
          title="Progress"
          tasks={board.tasks.filter((task) => task.column === "InProgress")}
        />
        <BoardColumn
          title="Done"
          tasks={board.tasks.filter((task) => task.column === "Done")}
        />
      </div>
    </div>
  )
}
