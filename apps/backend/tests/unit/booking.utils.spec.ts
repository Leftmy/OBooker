// tests/unit/bookings.utils.spec.ts
import { isTimeOverlapping } from '../../src/modules/bookings/bookings.utils';

describe('Bookings Utils - isTimeOverlapping', () => {
  const startA = new Date('2026-09-01T10:00:00Z');
  const endA = new Date('2026-09-01T12:00:00Z');

  it('should return true when new booking is completely inside existing interval', () => {
    const startB = new Date('2026-09-01T10:30:00Z');
    const endB = new Date('2026-09-01T11:30:00Z');

    expect(isTimeOverlapping(startA, endA, startB, endB)).toBe(true);
  });

  it('should return true when new booking overlaps the start of existing interval', () => {
    const startB = new Date('2026-09-01T09:30:00Z');
    const endB = new Date('2026-09-01T10:30:00Z');

    expect(isTimeOverlapping(startA, endA, startB, endB)).toBe(true);
  });

  it('should return true when new booking overlaps the end of existing interval', () => {
    const startB = new Date('2026-09-01T11:30:00Z');
    const endB = new Date('2026-09-01T12:30:00Z');

    expect(isTimeOverlapping(startA, endA, startB, endB)).toBe(true);
  });

  it('should return false when bookings are adjacent (endA === startB)', () => {
    const startB = new Date('2026-09-01T12:00:00Z');
    const endB = new Date('2026-09-01T13:00:00Z');

    expect(isTimeOverlapping(startA, endA, startB, endB)).toBe(false);
  });

  it('should return false when bookings do not overlap at all', () => {
    const startB = new Date('2026-09-01T14:00:00Z');
    const endB = new Date('2026-09-01T15:00:00Z');

    expect(isTimeOverlapping(startA, endA, startB, endB)).toBe(false);
  });
});