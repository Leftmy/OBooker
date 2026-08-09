// src/modules/bookings/bookings.controller.ts
import { Request, Response, NextFunction } from 'express';
import { BookingsService } from './bookings.service';
import { createBookingSchema } from './dto/create-booking.dto';
import { prisma } from '../../database/prisma.service';

export class BookingsController {
  private bookingsService: BookingsService;

  constructor() {
    this.bookingsService = new BookingsService(prisma);
  }

// src/modules/bookings/bookings.controller.ts

async create(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const parseResult = createBookingSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        // Змінено .errors на .issues
        error: parseResult.error.issues[0].message,
      });
    }

    const booking = await this.bookingsService.createBooking(
      userId,
      parseResult.data
    );

    return res.status(201).json(booking);
  } catch (error: any) {
    if (error.message === 'Room is already booked for this time range') {
      return res.status(409).json({ error: error.message });
    }
    if (error.message === 'Room not found') {
      return res.status(400).json({ error: error.message });
    }
    next(error);
  }
}
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const bookings = await this.bookingsService.getUserBookings(userId);
      return res.status(200).json(bookings);
    } catch (error) {
      next(error);
    }
  }

  async getMyBookings(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const type = req.query.type as 'upcoming' | 'past' | undefined;
      const bookings = await this.bookingsService.getUserBookings(userId, type);
      return res.status(200).json(bookings);
    } catch (error) {
      next(error);
    }
  }

  async getOne(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { id } = req.params;
      const booking = await this.bookingsService.getBookingById(userId, id);
      return res.status(200).json(booking);
    } catch (error: any) {
      if (error.message.includes('not found') || error.message.includes('access denied')) {
        return res.status(404).json({ error: error.message });
      }
      next(error);
    }
  }

  async cancel(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { id } = req.params;
      await this.bookingsService.cancelBooking(userId, id);
      return res.status(200).json({ message: 'Booking canceled successfully' });
    } catch (error: any) {
      if (error.message.includes('not found') || error.message.includes('access denied')) {
        return res.status(404).json({ error: error.message });
      }
      next(error);
    }
  }
}