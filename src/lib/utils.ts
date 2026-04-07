import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

export function truncate(str: string, length: number): string {
  return str.length > length ? str.slice(0, length) + '...' : str;
}
