import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Hilfsfunktion zum Zusammenführen von Tailwind-Klassen (wird von ShadCN-Komponenten verwendet)
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
