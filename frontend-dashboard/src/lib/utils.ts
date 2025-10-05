import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-AE', {
    style: 'currency',
    currency: 'AED',
    minimumFractionDigits: 2
  }).format(amount)
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes.toFixed(1)}m`
  }
  
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = Math.floor(minutes % 60)
  
  if (hours < 24) {
    return `${hours}h ${remainingMinutes}m`
  }
  
  const days = Math.floor(hours / 24)
  const remainingHours = hours % 24
  
  return `${days}d ${remainingHours}h`
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-AE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(date))
}

export function formatPhoneNumber(phone: string): string {
  // Format UAE phone numbers
  if (phone.startsWith('+971')) {
    const number = phone.replace('+971', '').replace(/\D/g, '')
    return `+971 ${number.slice(0, 2)} ${number.slice(2, 5)} ${number.slice(5)}`
  }
  return phone
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('')
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0
  return Math.round((value / total) * 100)
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func(...args), delay)
  }
}