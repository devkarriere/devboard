import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * @arch-badge Helper
 * @arch-subtitle clsx + tailwind-merge in einem Schritt
 * @arch-summary Vereint bedingte Klassen (`clsx`) mit Tailwind-Konflikt-Aufloesung (`twMerge`) zu einer einzigen Klassen-Liste.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
