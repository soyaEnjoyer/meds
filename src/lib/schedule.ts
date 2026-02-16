import { DAY_MILLIS, dateAdd, dateDiff, dateSet, dateStart, YEAR_DAYS } from '@/lib/date';
import { Enum } from '@/lib/enum';

export const WeekDay = new Enum({
  Monday: 1,
  Tuesday: 2,
  Wednesday: 4,
  Thursday: 8,
  Friday: 16,
  Saturday: 32,
  Sunday: 64,
});

export const Month = new Enum({
  January: 1,
  February: 2,
  March: 4,
  April: 8,
  May: 16,
  June: 32,
  July: 64,
  August: 128,
  September: 256,
  October: 512,
  November: 1024,
  December: 2048,
});

export interface Time {
  hour: number;
  minute: number;
}

export type ScheduleConfig = ({ active: true; startDate: Date } | { active: false; startDate: Date | null }) & {
  endDate: Date | null;
  time: Time;
  /** bitmask of `WeekDay.$value` */
  weekDays: number;
  /** bitmask of `Month.$value` */
  months: number;
  /** active days per cycle of daysActive + daysRest */
  daysActive: number;
  /** rest days per cycle of daysActive + daysRest */
  daysRest: number;
};

export function getNextRecurrence(config: ScheduleConfig, basis: Date = new Date()): Date | null {
  if (!config.active) return null;
  if (config.daysActive <= 0 || config.daysRest < 0 || config.weekDays <= 0 || config.months <= 0) return null;
  const cycleLength = config.daysActive + config.daysRest;
  const basisStart = dateStart(basis);
  const startDateStart = dateStart(config.startDate);
  // FIXME: refactor as linear when working
  for (let i = 1; i < YEAR_DAYS * cycleLength; ++i) {
    const date = dateAdd({ days: i }, basisStart);
    const cycleDay = Math.round(dateDiff(date, startDateStart) / DAY_MILLIS) % cycleLength;
    if (cycleDay >= config.daysActive) continue;
    const weekDay = 1 << ((date.getDay() || 7) - 1);
    if ((weekDay & config.weekDays) === 0) continue;
    const month = 1 << (date.getMonth() + 1);
    if ((month && config.months) === 0) continue;
    return dateSet({ hours: config.time.hour, minutes: config.time.minute }, date);
  }
  return null;
}
