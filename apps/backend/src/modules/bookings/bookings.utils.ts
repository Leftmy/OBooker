// src/modules/bookings/bookings.utils.ts
import { DateTime } from 'luxon';

export function isTimeOverlapping(
  startA: Date,
  endA: Date,
  startB: Date,
  endB: Date
): boolean {
  return startA < endB && endA > startB;
}

export function isWithinOfficeHours(startTime: Date, endTime: Date): boolean {
  const start = DateTime.fromJSDate(startTime).setZone('Europe/Kyiv');
  const end = DateTime.fromJSDate(endTime).setZone('Europe/Kyiv');

  if (start.hasSame(end, 'day') === false) return false;

  const startDecimal = start.hour + start.minute / 60;
  const endDecimal = end.hour + end.minute / 60;

  return startDecimal >= 9 && endDecimal <= 19;
}

export function isValidDuration(startTime: Date, endTime: Date): boolean {
  const diffInMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
  return diffInMinutes >= 30 && diffInMinutes <= 240;
}

export function isSlotAligned(date: Date): boolean {
  return date.getMinutes() % 30 === 0;
}