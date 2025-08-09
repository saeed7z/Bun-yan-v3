import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format numbers with commas while typing
export function formatNumberInput(value: string): string {
  // Remove non-digit characters except decimal point
  const cleanValue = value.replace(/[^\d.]/g, '')
  
  // Split by decimal point
  const parts = cleanValue.split('.')
  
  // Format the integer part with commas
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  
  // Return formatted value (keep only first decimal point)
  return parts.length > 2 ? parts[0] + '.' + parts[1] : parts.join('.')
}

// Convert formatted number back to plain number for calculations
export function parseFormattedNumber(value: string): string {
  return value.replace(/,/g, '')
}
