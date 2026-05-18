/**
 * Globaler Context für den Anzeigenamen des Nutzers.
 * Liest den initialen Namen aus dem LocalStorage und schreibt jede Änderung zurück.
 *
 * @arch-id usernamecontext
 * @arch-type state
 * @arch-title UserNameContext
 * @arch-badge Context
 * @arch-subtitle { userName, setUserName } · LocalStorage-Spiegel
 * @arch-summary Stellt den Benutzernamen App-weit bereit. Der Provider hält den Namen im State, persistiert ihn unter "kanban-user-name" im LocalStorage und liefert ihn über den useUserName-Hook an Consumer.
 * @arch-group context
 * @arch-step 4
 */
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
