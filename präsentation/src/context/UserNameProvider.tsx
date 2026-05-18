import { useState } from "react"
import { UserNameContext } from "./UserNameContext"

export default function UserNameProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [userName, setUserName] = useState(getUserNameFromLocalStorage)

  function getUserNameFromLocalStorage() {
    const storedName = localStorage.getItem("kanban-user-name")
    return storedName ?? ""
  }

  return (
    <UserNameContext.Provider
      value={{ userName: userName, setUserName: setUserName }}
    >
      {children}
    </UserNameContext.Provider>
  )
}
