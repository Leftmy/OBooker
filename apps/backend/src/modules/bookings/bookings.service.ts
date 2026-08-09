// src/modules/bookings/bookings.service.ts
import { PrismaClient } from '@prisma/client';
import { CreateBookingDto } from './dto/create-booking.dto';

export class BookingsService {
  constructor(private prisma: PrismaClient) {}

  async createBooking(userId: string, dto: CreateBookingDto) {
    const { roomId, startTime, endTime } = dto;
    const start = new Date(startTime);
    const end = new Date(endTime);

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

  async getUserBookings(userId: string, type?: 'upcoming' | 'past') {
    const now = new Date();
    const where: any = { userId };
    const orderBy: any = {};

    if (type === 'upcoming') {
      where.startTime = { gte: now };
      orderBy.startTime = 'asc';
    } else if (type === 'past') {
      where.endTime = { lt: now };
      orderBy.startTime = 'desc';
    } else {
      orderBy.startTime = 'desc';
    }

    return await this.prisma.booking.findMany({
      where,
      include: {
        room: true,
      },
      orderBy,
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