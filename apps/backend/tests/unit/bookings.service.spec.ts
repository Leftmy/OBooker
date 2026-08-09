// tests/unit/bookings.service.spec.ts
import { BookingsService } from '../../src/modules/bookings/bookings.service';
import { PrismaClient } from '@prisma/client';

describe('BookingsService Unit Tests', () => {
  let service: BookingsService;
  let prismaMock: any;

  beforeEach(() => {
    prismaMock = {
      room: {
        findUnique: jest.fn(),
      },
      booking: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    service = new BookingsService(prismaMock as unknown as PrismaClient);
  });

  describe('createBooking', () => {
    const mockDto = {
      title: 'Test Meeting',
      roomId: 'room-1',
      startTime: '2026-09-01T10:00:00Z',
      endTime: '2026-09-01T12:00:00Z',
    };
    const userId = 'user-1';

    it('should throw error if room does not exist', async () => {
      prismaMock.room.findUnique.mockResolvedValue(null);

      await expect(service.createBooking(userId, mockDto)).rejects.toThrow(
        'Room not found'
      );
    });

    it('should throw error if room is already booked for this time range', async () => {
      prismaMock.room.findUnique.mockResolvedValue({ id: 'room-1' });
      prismaMock.booking.findFirst.mockResolvedValue({ id: 'existing-booking' });

      await expect(service.createBooking(userId, mockDto)).rejects.toThrow(
        'Room is already booked for this time range'
      );
    });

    it('should successfully create a booking when time is available', async () => {
      prismaMock.room.findUnique.mockResolvedValue({ id: 'room-1' });
      prismaMock.booking.findFirst.mockResolvedValue(null);
      prismaMock.booking.create.mockResolvedValue({
        id: 'booking-1',
        userId,
        ...mockDto,
      });

      const result = await service.createBooking(userId, mockDto);

      expect(prismaMock.booking.create).toHaveBeenCalledWith({
        data: {
          title: mockDto.title,
          userId,
          roomId: mockDto.roomId,
          startTime: new Date(mockDto.startTime),
          endTime: new Date(mockDto.endTime),
        },
      });
      expect(result).toHaveProperty('id', 'booking-1');
    });
  });

  describe('getBookingById', () => {
    it('should throw error if booking belongs to another user', async () => {
      prismaMock.booking.findUnique.mockResolvedValue({
        id: 'booking-1',
        userId: 'other-user',
      });

      await expect(service.getBookingById('user-1', 'booking-1')).rejects.toThrow(
        'Booking not found or access denied'
      );
    });
  });
});