import { useState } from "react"
import { Button } from "../../components/ui/button"
import { Card } from "../../components/ui/card"
import type { Board } from "../../types/board.type"
import BoardCard from "./components/BoardCard"

export default function BoardOverview() {
  const [boards, setBoards] = useState<Board[]>([
    {
      id: "1",
      title: "Test",
      tasks: [{ id: "1", title: "Abc", column: "ToDo", description: "DEF" }],
    },
  ])

  return (
    <div className="container">
      <div className="flex flex-row place-content-between bg-red-50 py-4">
        <h1 className="text-xl font-bold">Meine Boards</h1>
        <Button>Neues Board</Button>
      </div>
      <div className="grid grid-cols-3 gap-4 bg-red-300 pt-4">
        {boards.map((board) => {
          return <BoardCard board={board} />
        })}
      </div>
    </div>
  )
}
