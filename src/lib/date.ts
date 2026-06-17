import type { Time } from '@/lib/drizzle/schema';

export const MINUTE_MS = 60_000;
export const HOUR_MS = MINUTE_MS * 60;
export const DAY_MS = HOUR_MS * 24;
export const WEEK_MS = DAY_MS * 7;

export function formatDatetimeIso(value: Date | null): string {
  if (!value) return '';
  return `${value.getFullYear()}-${(value.getMonth() + 1).toString().padStart(2, '0')}-${value.getDate().toString().padStart(2, '0')} ${value.getHours().toString().padStart(2, '0')}:${value.getMinutes().toString().padStart(2, '0')}`;
}

export function formatDateIso(value: Date | null): string {
  if (!value) return '';
  return `${value.getFullYear()}-${(value.getMonth() + 1).toString().padStart(2, '0')}-${value.getDate().toString().padStart(2, '0')}`;
}

export function formatTimeIso(value: Date | null | Time): string {
  if (!value) return '';
  if (value instanceof Date)
    return `${value.getHours().toString().padStart(2, '0')}:${value.getMinutes().toString().padStart(2, '0')}`;
  return `${value.hour.toString().padStart(2, '0')}:${value.minute.toString().padStart(2, '0')}`;
}

export function formatDateDistance(value: Date | null, ref?: Date | null): string {
  if (!value) return '';
  const dayStart = ref ? new Date(ref) : new Date();
  dayStart.setHours(0, 0, 0, 0);
  const valueStart = new Date(value);
  valueStart.setHours(0, 0, 0, 0);
  const days = Math.round((dayStart.getTime() - valueStart.getTime()) / DAY_MS);
  if (days === 0) return 'Today';
  if (days < 28) return `${days}d`;
  if (days > 300) return `${Math.round(days / 365)}y`;
  return `${Math.round(days / 7)}w`;
}

interface OptionalDateParts {
  year?: number;
  month?: number;
  day?: number;
  hour?: number;
  minute?: number;
  second?: number;
  ms?: number;
}

export function dateAdd(value: Date, { year, month, day, hour, minute, second, ms }: OptionalDateParts): Date {
  const date = new Date(value);
  if (year) date.setFullYear(date.getFullYear() + year);
  if (month) date.setMonth(date.getMonth() + month);
  if (day) date.setDate(date.getDate() + day);
  if (hour) date.setHours(date.getHours() + hour);
  if (minute) date.setMinutes(date.getMinutes() + minute);
  if (second) date.setSeconds(date.getSeconds() + second);
  if (ms) date.setMilliseconds(date.getMilliseconds() + ms);
  return date;
}

export function dateSet(value: Date, { year, month, day, hour, minute, second, ms }: OptionalDateParts): Date {
  const date = new Date(value);
  if (typeof year === 'number') date.setFullYear(year);
  if (typeof month === 'number') date.setMonth(month);
  if (typeof day === 'number') date.setDate(day);
  if (typeof hour === 'number') date.setHours(hour);
  if (typeof minute === 'number') date.setMinutes(minute);
  if (typeof second === 'number') date.setSeconds(second);
  if (typeof ms === 'number') date.setMilliseconds(ms);
  return date;
}

export function daysDiff(a: Date, b: Date): number {
  const aStart = dateSet(a, { hour: 0, minute: 0, ms: 0, second: 0 }).getTime();
  const bStart = dateSet(b, { hour: 0, minute: 0, ms: 0, second: 0 }).getTime();
  return Math.round((bStart - aStart) / DAY_MS);
}

export function dateMin(a: Date, b: Date): Date {
  return a < b ? a : b;
}

export function dateMax(a: Date, b: Date): Date {
  return a > b ? a : b;
}
