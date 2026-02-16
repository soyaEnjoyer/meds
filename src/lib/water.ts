import type { Time } from '@/lib/schedule';

export interface WaterConfig {
  target: number;
  start: Time;
  end: Time;
}
