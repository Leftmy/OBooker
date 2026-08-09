// src/modules/bookings/bookings.service.ts
import { PrismaClient } from '@prisma/client';
import { CreateBookingDto } from './dto/create-booking.dto';
import { isWithinOfficeHours, isValidDuration, isSlotAligned } from './bookings.utils';

export class BookingsService {
  constructor(private prisma: PrismaClient) {}

  async createBooking(userId: string, dto: CreateBookingDto) {
    const { roomId, startTime, endTime } = dto;
    const start = new Date(startTime);
    const end = new Date(endTime);

    if (start >= end) {
      throw new Error('Start time must be before end time');
    }

    if (!isSlotAligned(start) || !isSlotAligned(end)) {
      throw new Error('Booking time must be aligned to 30-minute intervals');
    }

    if (!isValidDuration(start, end)) {
      throw new Error('Duration must be between 30 minutes and 4 hours');
    }

    if (!isWithinOfficeHours(start, end)) {
      throw new Error('Booking must be within office hours (09:00 - 19:00)');
    }

    const room = await this.prisma.room.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      throw new Error('Room not found');
    }

    const existingBooking = await this.prisma.booking.findFirst({
      where: {
        roomId,
        startTime: { lt: end },
        endTime: { gt: start },
      },
    });

    if (existingBooking) {
      throw new Error('Room is already booked for this time range');
    }

    return await this.prisma.booking.create({
      data: {
        title: dto.title,
        userId,
        roomId,
        startTime: start,
        endTime: end,
      },
    });
  }

  async getUserBookings(
    userId: string,
    type?: 'upcoming' | 'past',
    cursor?: string,
    limit: number = 10
  ) {
    const now = new Date();
    const where: any = { userId };
    const orderBy: any = [];

    if (type === 'upcoming') {
      where.startTime = { gte: now };
      orderBy.push({ startTime: 'asc' });
      orderBy.push({ id: 'asc' });
    } else if (type === 'past') {
      where.endTime = { lt: now };
      orderBy.push({ startTime: 'desc' });
      orderBy.push({ id: 'desc' });
    } else {
      orderBy.push({ startTime: 'desc' });
      orderBy.push({ id: 'desc' });
    }

    const query: any = {
      where,
      include: { room: true },
      orderBy,
      take: limit + 1,
    };

    if (cursor) {
      query.cursor = { id: cursor };
      query.skip = 1; // Skip the cursor itself
    }

    const bookings = await this.prisma.booking.findMany(query);
    const hasMore = bookings.length > limit;
    const items = hasMore ? bookings.slice(0, limit) : bookings;
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    return {
      items,
      nextCursor,
      hasMore,
    };
  }

  async getAllBookings(roomId?: string, startDate?: string, endDate?: string) {
    const where: any = {};
    
    if (roomId) {
      where.roomId = roomId;
    }

    if (startDate && endDate) {
      where.startTime = { gte: new Date(startDate) };
      where.endTime = { lte: new Date(endDate) };
    }

    return await this.prisma.booking.findMany({
      where,
      include: { room: true },
      orderBy: { startTime: 'asc' },
    });
  }

  async getBookingById(userId: string, bookingId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        room: true,
      },
    });

    if (!booking || booking.userId !== userId) {
      throw new Error('Booking not found or access denied');
    }

    return booking;
  }

  async cancelBooking(userId: string, bookingId: string) {
    await this.getBookingById(userId, bookingId);

    return await this.prisma.booking.delete({
      where: { id: bookingId },
    });
  }
}