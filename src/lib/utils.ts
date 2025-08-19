import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number): string {
  if (typeof value !== 'number') {
    return '0';
  }
  
  const options: Intl.NumberFormatOptions = {
    maximumFractionDigits: 2,
  };

  // Only show decimals if they are not zero
  if (value % 1 !== 0) {
    options.minimumFractionDigits = 2;
  } else {
    options.minimumFractionDigits = 0;
  }

  // Formato para Argentina: punto para miles, coma para decimales.
  return value.toLocaleString('es-AR', options);
}
