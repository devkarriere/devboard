import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../../components/ui/dialog"
import { Input } from "../../../components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../../components/ui/popover"
import { Calendar } from "../../../components/ui/calendar"
import { format } from "date-fns"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select"
import { ChevronDownIcon } from "lucide-react"
import type { Task } from "../../../types/board.type"
import { Button } from "../../../components/ui/button"
import { useContext, useState } from "react"
import { Textarea } from "../../../components/ui/textarea"
import { UserNameContext } from "../../../context/UserNameContext"

export default function TaskDialog({
  open,
  handleOpenChange,
  onSubmitUpdate,
  title,
  description,
  task,
}: {
  open: boolean
  handleOpenChange: (open: boolean) => void
  onSubmitUpdate: (task: Task) => void
  title: string
  description: string
  task: Task
}) {
  const context = useContext(UserNameContext)
  const [taskTitle, setTaskTitle] = useState<string>(task.title)

  const [taskDescription, setTaskDescription] = useState<string>(
    task.description ?? ""
  )
  const [selectedPerson, setSelectedPerson] = useState<string>(
    task.assignedTo ?? " "
  )
  const [date, setDate] = useState<Date | undefined>(
    task.deadline ? new Date(task.deadline) : undefined
  )

  function handleSubmitUpdate() {
    const updatedTask: Task = {
      id: task.id,
      title: taskTitle,
      description: taskDescription,
      deadline: date?.toISOString(),
      assignedTo: selectedPerson,
      column: task.column,
    }

    onSubmitUpdate(updatedTask)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div>
          <span>Titel</span>
          <Input
            value={taskTitle}
            onChange={(e) => setTaskTitle(e.target.value)}
          />
        </div>
        <div>
          <span>Beschreibung</span>
          <Textarea
            value={taskDescription}
            onChange={(e) => setTaskDescription(e.target.value)}
          />
        </div>
        <div>
          <span>Zugewiesen an</span>
          <Select value={selectedPerson} onValueChange={setSelectedPerson}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Theme" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value=" ">Keine Zuweisung</SelectItem>
                <SelectItem value={context?.userName ?? "undefined"}>
                  {context?.userName ?? "undefined"}
                </SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col">
          <span>Deadline</span>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                data-empty={!date}
                className="w-full justify-between text-left font-normal data-[empty=true]:text-muted-foreground"
              >
                {date ? format(date, "dd.MM.yyyy") : <span>Pick a date</span>}
                <ChevronDownIcon />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                defaultMonth={date}
              />
            </PopoverContent>
          </Popover>
        </div>
        <DialogFooter>
          <DialogClose>
            <Button variant={"outline"}>Abbrechen</Button>
          </DialogClose>
          {taskTitle === "" ? (
            <Button disabled>Speichern</Button>
          ) : (
            <DialogClose>
              <Button onClick={handleSubmitUpdate}>Speichern</Button>
            </DialogClose>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
