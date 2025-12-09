import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

export const formatDate = (date: string | Date): string => {
  if (!date) return '-';
  try {
    const parsedDate = typeof date === 'string' ? parseISO(date) : date;
    return format(parsedDate, 'dd/MM/yyyy', { locale: fr });
  } catch {
    return '-';
  }
};

export const formatDateTime = (date: string | Date): string => {
  if (!date) return '-';
  try {
    const parsedDate = typeof date === 'string' ? parseISO(date) : date;
    return format(parsedDate, 'dd/MM/yyyy HH:mm', { locale: fr });
  } catch {
    return '-';
  }
};

export const formatName = (firstName: string, lastName: string): string => {
  return `${firstName} ${lastName}`;
};

export const formatMeterId = (id: string): string => {
  return id.padStart(9, '0');
};

export const formatConsumption = (value: number, type: 'WATER' | 'ELECTRICITY'): string => {
  const unit = type === 'WATER' ? 'm³' : 'kWh';
  return `${value.toFixed(2)} ${unit}`;
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
};

export const getCoverageRateColor = (rate: number): string => {
  if (rate >= 80) return 'text-green-600';
  if (rate >= 50) return 'text-yellow-600';
  return 'text-red-600';
};

export const getCoverageRateBgColor = (rate: number): string => {
  if (rate >= 80) return 'bg-green-100';
  if (rate >= 50) return 'bg-yellow-100';
  return 'bg-red-100';
};
