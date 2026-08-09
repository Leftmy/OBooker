import { BookingsService } from '../../src/modules/bookings/bookings.service';
import { PrismaClient } from '@prisma/client';

const mockPrisma = {
  room: {
    findUnique: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
  },
  booking: {
    findFirst: jest.fn(),
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    delete: jest.fn(),
  },
} as unknown as PrismaClient;

describe('BookingsService (Unit Tests)', () => {
  let service: BookingsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new BookingsService(mockPrisma);
  });

  const getTomorrowAt = (hours: number, minutes: number = 0): string => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(hours, minutes, 0, 0);
    return d.toISOString();
  };

  const getPastAt = (hours: number, minutes: number = 0): string => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    d.setHours(hours, minutes, 0, 0);
    return d.toISOString();
  };

  describe('createBooking - Title Validation', () => {
    it('should throw if title is empty or only whitespace', async () => {
      const dto = {
        title: '   ',
        roomId: 'room-1',
        userId: 'user-1',
        startTime: getTomorrowAt(10, 0),
        endTime: getTomorrowAt(11, 0),
      };

      await expect(service.createBooking(dto)).rejects.toThrow(
        'Title is required and must be between 1 and 100 characters'
      );
    });

    it('should throw if title exceeds 100 characters', async () => {
      const dto = {
        title: 'a'.repeat(101),
        roomId: 'room-1',
        userId: 'user-1',
        startTime: getTomorrowAt(10, 0),
        endTime: getTomorrowAt(11, 0),
      };

      await expect(service.createBooking(dto)).rejects.toThrow(
        'Title is required and must be between 1 and 100 characters'
      );
    });
  });

  describe('createBooking - Time Alignment & Duration Validation', () => {
    it('should throw if start time is not aligned to 30-minute interval', async () => {
      const dto = {
        title: 'Sync',
        roomId: 'room-1',
        userId: 'user-1',
        startTime: getTomorrowAt(10, 15),
        endTime: getTomorrowAt(11, 0),
      };

      await expect(service.createBooking(dto)).rejects.toThrow(
        'Start and end time must be aligned to 30-minute intervals'
      );
    });

    it('should throw if end time is not aligned to 30-minute interval', async () => {
      const dto = {
        title: 'Sync',
        roomId: 'room-1',
        userId: 'user-1',
        startTime: getTomorrowAt(10, 0),
        endTime: getTomorrowAt(10, 45),
      };

      await expect(service.createBooking(dto)).rejects.toThrow(
        'Start and end time must be aligned to 30-minute intervals'
      );
    });

    it('should throw if duration is less than 30 minutes', async () => {
      const dto = {
        title: 'Quick Call',
        roomId: 'room-1',
        userId: 'user-1',
        startTime: getTomorrowAt(10, 0),
        endTime: getTomorrowAt(10, 0),
      };

      await expect(service.createBooking(dto)).rejects.toThrow(
        'Booking duration must be between 30 minutes and 4 hours'
      );
    });

    it('should throw if duration is greater than 4 hours', async () => {
      const dto = {
        title: 'Long Workshop',
        roomId: 'room-1',
        userId: 'user-1',
        startTime: getTomorrowAt(10, 0),
        endTime: getTomorrowAt(14, 30),
      };

      await expect(service.createBooking(dto)).rejects.toThrow(
        'Booking duration must be between 30 minutes and 4 hours'
      );
    });
  });

  describe('createBooking - Working Hours & Future Bounds', () => {
    it('should throw if booking is in the past', async () => {
      const dto = {
        title: 'Past Meeting',
        roomId: 'room-1',
        userId: 'user-1',
        startTime: getPastAt(10, 0),
        endTime: getPastAt(11, 0),
      };

      await expect(service.createBooking(dto)).rejects.toThrow(
        'Booking time must be in the future'
      );
    });

    it('should throw if start time is before working hours (08:00)', async () => {
      const dto = {
        title: 'Early Meeting',
        roomId: 'room-1',
        userId: 'user-1',
        startTime: getTomorrowAt(7, 30),
        endTime: getTomorrowAt(8, 30),
      };

      await expect(service.createBooking(dto)).rejects.toThrow(
        'Bookings can only be made within working hours (08:00 - 20:00)'
      );
    });

    it('should throw if end time is after working hours (20:00)', async () => {
      const dto = {
        title: 'Late Meeting',
        roomId: 'room-1',
        userId: 'user-1',
        startTime: getTomorrowAt(19, 30),
        endTime: getTomorrowAt(20, 30),
      };

      await expect(service.createBooking(dto)).rejects.toThrow(
        'Bookings can only be made within working hours (08:00 - 20:00)'
      );
    });
  });

  describe('createBooking - Entity Existence & Overlap Constraints', () => {
    it('should throw if room does not exist', async () => {
      (mockPrisma.room.findUnique as jest.Mock).mockResolvedValue(null);

      const dto = {
        title: 'Sync',
        roomId: 'non-existent-room',
        userId: 'user-1',
        startTime: getTomorrowAt(10, 0),
        endTime: getTomorrowAt(11, 0),
      };

      await expect(service.createBooking(dto)).rejects.toThrow('Room not found');
    });

    it('should throw if user does not exist', async () => {
      (mockPrisma.room.findUnique as jest.Mock).mockResolvedValue({ id: 'room-1' });
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const dto = {
        title: 'Sync',
        roomId: 'room-1',
        userId: 'non-existent-user',
        startTime: getTomorrowAt(10, 0),
        endTime: getTomorrowAt(11, 0),
      };

      await expect(service.createBooking(dto)).rejects.toThrow('User not found');
    });

    it('should throw if time slot overlaps with an existing booking', async () => {
      (mockPrisma.room.findUnique as jest.Mock).mockResolvedValue({ id: 'room-1' });
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'user-1' });
      (mockPrisma.booking.findFirst as jest.Mock).mockResolvedValue({ id: 'b-existing' });

      const dto = {
        title: 'Overlap Meeting',
        roomId: 'room-1',
        userId: 'user-1',
        startTime: getTomorrowAt(10, 0),
        endTime: getTomorrowAt(11, 0),
      };

      await expect(service.createBooking(dto)).rejects.toThrow(
        'Room is already booked for the selected time slot'
      );
    });

    it('should succeed when booking is back-to-back with an existing one', async () => {
      (mockPrisma.room.findUnique as jest.Mock).mockResolvedValue({ id: 'room-1' });
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'user-1' });
      (mockPrisma.booking.findFirst as jest.Mock).mockResolvedValue(null);
      (mockPrisma.booking.create as jest.Mock).mockResolvedValue({
        id: 'b-new',
        title: 'Back-to-back Meeting',
        roomId: 'room-1',
        userId: 'user-1',
        startTime: new Date(getTomorrowAt(11, 0)),
        endTime: new Date(getTomorrowAt(12, 0)),
      });

      const dto = {
        title: 'Back-to-back Meeting',
        roomId: 'room-1',
        userId: 'user-1',
        startTime: getTomorrowAt(11, 0),
        endTime: getTomorrowAt(12, 0),
      };

      const result = await service.createBooking(dto);
      expect(result.id).toBe('b-new');
      expect(mockPrisma.booking.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('cancelBooking', () => {
    it('should throw if booking does not exist', async () => {
      (mockPrisma.booking.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.cancelBooking('invalid-id', 'user-1')).rejects.toThrow(
        'Booking not found'
      );
    });

    it('should throw if cancellation is attempted by non-owner', async () => {
      (mockPrisma.booking.findUnique as jest.Mock).mockResolvedValue({
        id: 'b1',
        userId: 'owner-user',
      });

      await expect(service.cancelBooking('b1', 'other-user')).rejects.toThrow(
        'You do not have permission to cancel this booking'
      );
    });

    it('should cancel booking successfully when called by owner', async () => {
      (mockPrisma.booking.findUnique as jest.Mock).mockResolvedValue({
        id: 'b1',
        userId: 'owner-user',
      });
      (mockPrisma.booking.delete as jest.Mock).mockResolvedValue({ id: 'b1' });

      const result = await service.cancelBooking('b1', 'owner-user');
      expect(result).toEqual({ id: 'b1' });
      expect(mockPrisma.booking.delete).toHaveBeenCalledWith({ where: { id: 'b1' } });
    });
  });
});
