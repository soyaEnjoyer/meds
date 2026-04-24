export const MINUTE_MS = 60_000;
export const HOUR_MS = MINUTE_MS * 60;
export const DAY_MS = HOUR_MS * 24;
export const WEEK_MS = DAY_MS * 7;

export function formatDateIso(value: Date | null): string {
  if (!value) return '';
  return `${value.getFullYear()}-${(value.getMonth() + 1).toString().padStart(2, '0')}-${value.getDate().toString().padStart(2, '0')}`;
}

export function formatDateDistance(value: Date | null): string {
  if (!value) return '';
  const dayStart = new Date();
  dayStart.setHours(0, 0, 0, 0);
  const valueStart = new Date(value);
  valueStart.setHours(0, 0, 0, 0);
  const days = Math.round((dayStart.getTime() - valueStart.getTime()) / DAY_MS);
  if (days === 0) return 'Today';
  if (days < 7) return `${days}d`;
  if (days > 300) return `${Math.round(days / 365)}y`;
  return `${Math.round(days / 7)}w`;
}
