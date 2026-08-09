import { z } from 'zod';

export const createRoomSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  capacity: z.number().int().positive('Capacity must be a positive integer'),
  floor: z.number().int(),
});

export type CreateRoomDto = z.infer<typeof createRoomSchema>;

export const updateRoomSchema = createRoomSchema.partial();
export type UpdateRoomDto = z.infer<typeof updateRoomSchema>;

export const getRoomsQuerySchema = z.object({
  minCapacity: z.coerce
    .number({ message: 'minCapacity must be a number' })
    .int('minCapacity must be an integer')
    .positive('minCapacity must be a positive integer')
    .optional(),
  sortBy: z.enum(['name', 'capacity', 'floor']).optional().default('name'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
});

export type GetRoomsQueryDto = z.infer<typeof getRoomsQuerySchema>;