import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function lowerToSentenceCase(value: string): string {
  if (!value.length) return '';
  return `${value[0].toLocaleUpperCase()}${value.slice(1)}`;
}

type Trigger = () => void;

export function debounce(callback: () => unknown, millis: number): Trigger {
  let timeout: NodeJS.Timeout | null = null;
  return () => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(callback, millis);
  };
}

export function throttle(callback: () => unknown, millis: number): Trigger {
  let prev: Date | null = null;
  let timeout: NodeJS.Timeout | null = null;
  function callAndUpdate(): void {
    prev = new Date();
    // oxlint-disable-next-line promise/prefer-await-to-callbacks
    callback();
  }
  return () => {
    const delay = prev ? millis - (Date.now() - prev.getTime()) : 0;
    if (timeout) clearTimeout(timeout);
    if (delay > 0) timeout = setTimeout(callAndUpdate, delay);
    else callAndUpdate();
  };
}
