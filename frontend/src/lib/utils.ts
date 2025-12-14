import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date, formatStr: string = 'dd MMM yyyy'): string {
  return format(new Date(date), formatStr, { locale: fr });
}

export function formatDateTime(date: string | Date): string {
  return format(new Date(date), 'dd MMM yyyy HH:mm', { locale: fr });
}

export function formatNumber(num: number, decimals: number = 2): string {
  return new Intl.NumberFormat('fr-MA', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-MA', {
    style: 'currency',
    currency: 'MAD',
  }).format(amount);
}

export function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export function truncate(str: string, length: number): string {
  return str.length > length ? `${str.substring(0, length)}...` : str;
}

export function getCoverageColor(rate: number): string {
  if (rate >= 80) return 'text-green-600 bg-green-100';
  if (rate >= 50) return 'text-orange-600 bg-orange-100';
  return 'text-red-600 bg-red-100';
}

export function getMeterTypeLabel(type: 'WATER' | 'ELECTRICITY'): string {
  return type === 'WATER' ? 'Eau' : 'Électricité';
}

export function getMeterTypeColor(type: 'WATER' | 'ELECTRICITY'): string {
  return type === 'WATER' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800';
}

export function downloadFile(blob: Blob, filename: string): void {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

/**
 * Format last name to uppercase
 * Ex: "ait Mohamed" → "AIT MOHAMED"
 */
export function formatLastName(value: string): string {
  return value.toUpperCase();
}

/**
 * Format first name to proper case (first letter uppercase, rest lowercase)
 * Handles compound names with hyphens
 * Ex: "mohamed-amine" → "Mohamed-Amine"
 * Ex: "fatima ezzahra" → "Fatima Ezzahra"
 */
export function formatFirstName(value: string): string {
  return value
    .split(/[\s-]/)
    .map((part) => {
      if (part.length === 0) return part;
      return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
    })
    .join(value.includes('-') ? '-' : ' ');
}
