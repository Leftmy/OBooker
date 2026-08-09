import { z } from 'zod';

export const createBookingSchema = z
  .object({
    title: z.string().trim().min(1, 'Title is required').max(100, 'Title too long (max 100)'),
    roomId: z.string().min(1, 'roomId is required'),
    startTime: z.string().datetime({ message: 'startTime must be valid ISO date string' }),
    endTime: z.string().datetime({ message: 'endTime must be valid ISO date string' }),
  })
  .refine((data) => new Date(data.startTime) > new Date(), {
    message: 'Booking must be in the future',
    path: ['startTime'],
  })
  .refine(
    (data) => {
      const start = new Date(data.startTime);
      const end = new Date(data.endTime);
      const durationMin = (end.getTime() - start.getTime()) / (1000 * 60);

      return durationMin >= 30 && durationMin <= 240;
    },
    {
      message: 'Duration must be between 30 minutes and 4 hours',
      path: ['endTime'],
    }
  )
  .refine(
    (data) => {
      const start = new Date(data.startTime);
      const end = new Date(data.endTime);

      return start.getMinutes() % 30 === 0 && end.getMinutes() % 30 === 0;
    },
    {
      message: 'Start and end time must be aligned to 30-minute intervals',
      path: ['startTime'],
    }
  );

export type CreateBookingDto = z.infer<typeof createBookingSchema>;