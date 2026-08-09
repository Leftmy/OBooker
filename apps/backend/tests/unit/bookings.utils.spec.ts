// tests/unit/bookings.utils.spec.ts
import {
  isTimeOverlapping,
  isWithinOfficeHours,
  isValidDuration,
  isSlotAligned
} from '../../src/modules/bookings/bookings.utils';

describe('Bookings Utils', () => {
  describe('isTimeOverlapping', () => {
    it('should return false when bookings are back-to-back (endA === startB)', () => {
      const startA = new Date('2026-09-01T10:00:00.000Z');
      const endA = new Date('2026-09-01T11:00:00.000Z');
      const startB = new Date('2026-09-01T11:00:00.000Z');
      const endB = new Date('2026-09-01T12:00:00.000Z');

      expect(isTimeOverlapping(startA, endA, startB, endB)).toBe(false);
    });

    it('should return true when bookings have partial overlap', () => {
      const startA = new Date('2026-09-01T10:00:00.000Z');
      const endA = new Date('2026-09-01T11:00:00.000Z');
      const startB = new Date('2026-09-01T10:30:00.000Z');
      const endB = new Date('2026-09-01T11:30:00.000Z');

      expect(isTimeOverlapping(startA, endA, startB, endB)).toBe(true);
    });

    it('should return true when bookings are an exact match', () => {
      const startA = new Date('2026-09-01T10:00:00.000Z');
      const endA = new Date('2026-09-01T11:00:00.000Z');
      const startB = new Date('2026-09-01T10:00:00.000Z');
      const endB = new Date('2026-09-01T11:00:00.000Z');

      expect(isTimeOverlapping(startA, endA, startB, endB)).toBe(true);
    });

    it('should return false when bookings are on adjacent days with same hours', () => {
      const startA = new Date('2026-09-01T10:00:00.000Z');
      const endA = new Date('2026-09-01T11:00:00.000Z');
      const startB = new Date('2026-09-02T10:00:00.000Z');
      const endB = new Date('2026-09-02T11:00:00.000Z');

      expect(isTimeOverlapping(startA, endA, startB, endB)).toBe(false);
    });
  });

  describe('isWithinOfficeHours', () => {
    it('should return true for times within 09:00 and 19:00 Kyiv time', () => {
      // 09:00 Kyiv is 06:00 UTC (Summer time / EEST)
      const start = new Date('2026-09-01T06:00:00.000Z'); 
      const end = new Date('2026-09-01T16:00:00.000Z'); // 19:00 Kyiv time
      
      expect(isWithinOfficeHours(start, end)).toBe(true);
    });

    it('should return false if outside office hours', () => {
      // 08:30 Kyiv is 05:30 UTC
      const start = new Date('2026-09-01T05:30:00.000Z');
      const end = new Date('2026-09-01T06:30:00.000Z');

      expect(isWithinOfficeHours(start, end)).toBe(false);
    });
    
    it('should return false if spans across multiple days', () => {
      const start = new Date('2026-09-01T10:00:00.000Z');
      const end = new Date('2026-09-02T11:00:00.000Z');
      
      expect(isWithinOfficeHours(start, end)).toBe(false);
    });
  });

  describe('isValidDuration', () => {
    it('should return true for a 30-minute duration', () => {
      const start = new Date('2026-09-01T10:00:00.000Z');
      const end = new Date('2026-09-01T10:30:00.000Z');
      expect(isValidDuration(start, end)).toBe(true);
    });

    it('should return false for duration less than 30 minutes', () => {
      const start = new Date('2026-09-01T10:00:00.000Z');
      const end = new Date('2026-09-01T10:29:00.000Z');
      expect(isValidDuration(start, end)).toBe(false);
    });

    it('should return false for duration more than 4 hours (240 mins)', () => {
      const start = new Date('2026-09-01T10:00:00.000Z');
      const end = new Date('2026-09-01T15:00:00.000Z'); // 5 hours
      expect(isValidDuration(start, end)).toBe(false);
    });
  });

  describe('isSlotAligned', () => {
    it('should return true if minutes are aligned to 30', () => {
      const date1 = new Date('2026-09-01T10:00:00.000Z');
      const date2 = new Date('2026-09-01T10:30:00.000Z');
      
      expect(isSlotAligned(date1)).toBe(true);
      expect(isSlotAligned(date2)).toBe(true);
    });

    it('should return false if minutes are not aligned to 30', () => {
      const date = new Date('2026-09-01T10:15:00.000Z');
      expect(isSlotAligned(date)).toBe(false);
    });
  });
});
