// oxlint-disable sort-keys

// weekdays
export const weekdays = [
  [1, 'Monday'],
  [2, 'Tuesday'],
  [4, 'Wednesday'],
  [8, 'Thursday'],
  [16, 'Friday'],
  [32, 'Saturday'],
  [64, 'Sunday'],
] as const;

export type WeekdayTuple = (typeof weekdays)[number];
export type WeekdayId = WeekdayTuple[0];
export type WeekdayName = WeekdayTuple[1];

export const weekdayNameToId: Record<WeekdayName, WeekdayId> = {
  Monday: 1,
  Tuesday: 2,
  Wednesday: 4,
  Thursday: 8,
  Friday: 16,
  Saturday: 32,
  Sunday: 64,
} as const;

export const weekdayIdToName: Record<WeekdayId, WeekdayName> = {
  1: 'Monday',
  2: 'Tuesday',
  4: 'Wednesday',
  8: 'Thursday',
  16: 'Friday',
  32: 'Saturday',
  64: 'Sunday',
} as const;

// months
export const months = [
  [1, 'January'],
  [2, 'February'],
  [4, 'March'],
  [8, 'April'],
  [16, 'May'],
  [32, 'June'],
  [64, 'July'],
  [128, 'August'],
  [256, 'September'],
  [512, 'October'],
  [1024, 'November'],
  [2048, 'December'],
] as const;

export type MonthTuple = (typeof months)[number];
export type MonthId = MonthTuple[0];
export type MonthName = MonthTuple[1];

export const monthNameToId: Record<MonthName, MonthId> = {
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
} as const;

export const monthIdToName: Record<MonthId, MonthName> = {
  1: 'January',
  2: 'February',
  4: 'March',
  8: 'April',
  16: 'May',
  32: 'June',
  64: 'July',
  128: 'August',
  256: 'September',
  512: 'October',
  1024: 'November',
  2048: 'December',
} as const;
