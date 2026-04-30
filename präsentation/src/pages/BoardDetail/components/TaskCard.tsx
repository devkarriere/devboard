import { Trash2 } from "lucide-react"
import {
  Card,
  CardAction,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card"
import { Button } from "../../../components/ui/button"
import type { Task } from "../../../types/board.type"

export default function TaskCard({ task }: { task: Task }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{task.title}</CardTitle>
        <CardDescription>{task.description}</CardDescription>
        <CardAction>
          <Button
            className="text-muted-foreground hover:text-destructive"
            variant="ghost"
            size="icon-lg"
          >
            <Trash2 />
          </Button>
        </CardAction>
      </CardHeader>
    </Card>
  )
}
