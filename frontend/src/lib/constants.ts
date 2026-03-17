import type { User } from "@/types";

// Fester Benutzer für Stufe 1 – wird in Stufe 2 durch Supabase Auth ersetzt
export const CURRENT_USER: User = {
  id: "user-1",
  name: "Max Mustermann",
  email: "max@example.com",
  role: "admin",
};
