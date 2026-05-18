import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * @arch-badge Utility
 * @arch-subtitle Tailwind-Klassen mergen
 * @arch-summary Kombiniert clsx für Conditional-Klassen mit tailwind-merge, das Konflikte (z. B. p-2 vs. p-4) korrekt auflöst.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
