import { createContext, useContext, useState, type ReactNode } from "react";
import { getUserName } from "@/lib/storage";

interface UserNameContextType {
  userName: string;
  setUserName: (name: string) => void;
}

const UserNameContext = createContext<UserNameContextType | null>(null);

export function UserNameProvider({ children }: { children: ReactNode }) {
  const [userName, setUserNameState] = useState(getUserName);

  function setUserName(name: string) {
    localStorage.setItem("kanban-user-name", name);
    setUserNameState(name);
  }

  return (
    <UserNameContext.Provider value={{ userName, setUserName }}>
      {children}
    </UserNameContext.Provider>
  );
}

export function useUserName() {
  const context = useContext(UserNameContext);
  if (!context) {
    throw new Error("useUserName muss innerhalb von UserNameProvider verwendet werden");
  }
  return context;
}
