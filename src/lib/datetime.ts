export const MILLI_SECONDS = 0.001;
export const SECOND_MILLIS = 1000;
export const MINUTE_SECONDS = 60;
export const MINUTE_MILLIS = MINUTE_SECONDS * 1000;
export const HOUR_MINUTES = 60;
export const HOUR_SECONDS = 3600;
export const HOUR_MILLIS = HOUR_SECONDS * 1000;
export const DAY_SECONDS = 86400;
export const DAY_MILLIS = DAY_SECONDS * 1000;
export const WEEK_DAYS = 7;
export const WEEK_SECONDS = WEEK_DAYS * DAY_SECONDS;
export const WEEK_MILLIS = WEEK_DAYS * DAY_MILLIS;
export const MONTH_DAYS = 30;
export const MONTH_MILLIS = MONTH_DAYS * DAY_MILLIS;
export const YEAR_DAYS = 365;
export const YEAR_MILLIS = YEAR_DAYS * DAY_MILLIS;
export const SECOND_MICROS = 1_000_000;

export class Date2 {
  #date: Date;
  constructor(value?: Date | number | string) {
    this.#date = typeof value === 'undefined' ? new Date() : new Date(value);
  }
  add({
    days,
    hours,
    millis,
    minutes,
    months,
    seconds,
    years,
  }: {
    millis?: number;
    seconds?: number;
    minutes?: number;
    hours?: number;
    days?: number;
    months?: number;
    years?: number;
  }): this {
    if (days) this.#date.setDate(this.#date.getDate() + days);
    if (hours) this.#date.setHours(this.#date.getHours() + hours);
    if (millis) this.#date.setMilliseconds(this.#date.getMilliseconds() + millis);
    if (minutes) this.#date.setMinutes(this.#date.getMinutes() + minutes);
    if (months) this.#date.setMonth(this.#date.getMonth() + months);
    if (seconds) this.#date.setSeconds(this.#date.getSeconds() + seconds);
    if (years) this.#date.setFullYear(this.#date.getFullYear() + years);
    return this;
  }
  set({
    days,
    hours,
    millis,
    minutes,
    months,
    seconds,
    years,
  }: {
    millis?: number;
    seconds?: number;
    minutes?: number;
    hours?: number;
    days?: number;
    months?: number;
    years?: number;
  }): this {
    if (typeof days !== 'undefined') this.#date.setDate(days);
    if (typeof hours !== 'undefined') this.#date.setHours(hours);
    if (typeof millis !== 'undefined') this.#date.setMilliseconds(millis);
    if (typeof minutes !== 'undefined') this.#date.setMinutes(minutes);
    if (typeof months !== 'undefined') this.#date.setMonth(months);
    if (typeof seconds !== 'undefined') this.#date.setSeconds(seconds);
    if (typeof years !== 'undefined') this.#date.setFullYear(years);
    return this;
  }
  /** `this` - `other` in millis */
  diff(other: Date2 | Date | string | number) {
    const date = other instanceof Date2 ? other.#date : other instanceof Date ? other : new Date(other);
    return this.#date.getTime() - date.getTime();
  }
  midnight(): this {
    return this.set({ hours: 0, minutes: 0, seconds: 0, millis: 0 });
  }
  toIso(): string {
    return this.#date.toISOString();
  }
  toLocalIso(
    {
      dateJoiner,
      timeJoiner,
      joiner,
      showDate,
      showTime,
    }: {
      dateJoiner: string;
      timeJoiner: string;
      joiner: string;
      showDate: boolean | 'auto';
      showTime: 'h' | 'm' | 's' | 'ms' | null;
    } = {
      dateJoiner: '-',
      timeJoiner: ':',
      joiner: ' ',
      showDate: 'auto',
      showTime: 'm',
    }
  ): string {
    const localShowDate =
      typeof showDate === 'boolean'
        ? showDate
        : (() => {
            const now = new Date();
            return (
              now.getFullYear() !== this.#date.getFullYear() ||
              now.getMonth() !== this.#date.getMonth() ||
              now.getDate() !== this.#date.getDate()
            );
          })();
    return [
      ...(localShowDate
        ? [
            [
              this.#date.getFullYear().toString().padStart(4, '0'),
              (this.#date.getMonth() + 1).toString().padStart(2, '0'),
              this.#date.getDate().toString().padStart(2, '0'),
            ].join(dateJoiner),
          ]
        : []),
      ...(showTime
        ? [
            [
              this.#date.getHours().toString().padStart(2, '0'),
              ...(showTime === 'm' || showTime === 's' || showTime === 'ms'
                ? [this.#date.getMinutes().toString().padStart(2, '0')]
                : []),
              ...(showTime === 's' || showTime === 'ms'
                ? [
                    `${this.#date.getSeconds().toString().padStart(2, '0')}${showTime === 'ms' ? `.${this.#date.getMilliseconds().toString().padStart(3, '0')}` : ''}`,
                  ]
                : []),
            ].join(timeJoiner),
          ]
        : []),
    ].join(joiner);
  }
  toLocale(
    { dateStyle, timeStyle }: { dateStyle: 'long' | 'short' | null; timeStyle: 'long' | 'short' | null } = {
      dateStyle: 'short',
      timeStyle: 'short',
    }
  ): string {
    if (dateStyle && timeStyle) return this.#date.toLocaleString(undefined, { dateStyle, timeStyle });
    if (dateStyle) return this.#date.toLocaleDateString(undefined, { dateStyle });
    if (timeStyle) return this.#date.toLocaleTimeString(undefined, { timeStyle });
    return '';
  }
  toRelative() {
    const ts = this.#date.getTime();
    const now = Date.now();
    const totalMillis = Math.abs(now - ts);
    const make = (unit: string, mod: number, div: number) => {
      const value = Math.floor((mod ? totalMillis % mod : totalMillis) / div);
      return {
        string: `${value.toLocaleString()}${unit}`,
        value,
      };
    };
    const years = make('y', 0, YEAR_MILLIS);
    const months = make('mo', YEAR_MILLIS, MONTH_MILLIS);
    const days = make('d', MONTH_MILLIS, DAY_MILLIS);
    const hours = make('h', DAY_MILLIS, HOUR_MILLIS);
    const minutes = make('m', HOUR_MILLIS, MINUTE_MILLIS);
    const parts =
      years.value >= 3
        ? [years]
        : years.value >= 1
          ? [years, months]
          : months.value >= 1
            ? [months, days]
            : days.value >= 3
              ? [days]
              : days.value >= 1
                ? [days, hours]
                : hours.value >= 12
                  ? [hours]
                  : hours.value >= 1
                    ? [hours, minutes]
                    : [minutes];
    const formatted = `${ts > now ? 'In ' : ''}${parts.map(({ string }) => string).join(', ')}${ts < now ? ' ago' : ''}`;
    return formatted;
  }
  get asDate(): Readonly<Date> {
    return new Date(this.#date);
  }
}

interface TimeLike {
  hour: number;
  minute: number;
  second: number;
  milli: number;
}

export class Time implements TimeLike {
  public hour: number;
  public minute: number;
  public second: number;
  public milli: number;
  constructor(
    ...[param]:
      | [date: Date | Date2 | number | string]
      | [
          time: {
            hour: number;
            minute?: number;
            second?: number;
            milli?: number;
          },
        ]
  ) {
    if (typeof param === 'object' && 'hour' in param) {
      this.hour = param.hour;
      this.minute = param.minute ?? 0;
      this.second = param.second ?? 0;
      this.milli = param.milli ?? 0;
    } else {
      const date = param instanceof Date2 ? param.asDate : new Date(param);
      this.hour = date.getHours();
      this.minute = date.getMinutes();
      this.second = date.getSeconds();
      this.milli = date.getMilliseconds();
    }
  }
  toString(
    { precision, joiner }: { precision: 'h' | 'm' | 's' | 'ms'; joiner: string } = { precision: 'm', joiner: ':' }
  ): string {
    return [
      this.hour.toString().padStart(2, '0'),
      ...(precision === 'm' || precision === 's' || precision === 'ms'
        ? [this.minute.toString().padStart(2, '0')]
        : []),
      ...(precision === 's' || precision === 'ms'
        ? [
            `${this.second.toString().padStart(2, '0')}${precision === 'ms' ? `.${this.milli.toString().padStart(3, '0')}` : ''}`,
          ]
        : []),
    ].join(joiner);
  }
}
