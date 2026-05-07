import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function lowerToSentenceCase(value: string): string {
  if (!value.length) return '';
  return `${value[0].toLocaleUpperCase()}${value.slice(1)}`;
}
