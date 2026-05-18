import { createContext } from "react"

type UserNameContextType = {
  userName: string
  setUserName: (name: string) => void
}

export const UserNameContext = createContext<UserNameContextType | null>(null)
