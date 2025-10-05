import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = 'AED'): string {
  return new Intl.NumberFormat('en-AE', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2
  }).format(amount);
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(date));
}

export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  
  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m`;
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'SUCCESS':
      return 'text-green-600 bg-green-100';
    case 'FAILED':
      return 'text-red-600 bg-red-100';
    case 'BUSY':
      return 'text-yellow-600 bg-yellow-100';
    case 'NO_ANSWER':
      return 'text-gray-600 bg-gray-100';
    default:
      return 'text-gray-600 bg-gray-100';
  }
}

export function getRoleColor(role: string): string {
  switch (role) {
    case 'SUPERADMIN':
      return 'text-purple-600 bg-purple-100';
    case 'ADMIN':
      return 'text-blue-600 bg-blue-100';
    case 'USER':
      return 'text-green-600 bg-green-100';
    default:
      return 'text-gray-600 bg-gray-100';
  }
}