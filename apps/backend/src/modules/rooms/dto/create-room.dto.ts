import { z } from 'zod';

export const createRoomSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  capacity: z.number().int().positive('Capacity must be a positive integer'),
  floor: z.number().int(),
});

export type CreateRoomDto = z.infer<typeof createRoomSchema>;

export const updateRoomSchema = createRoomSchema.partial();
export type UpdateRoomDto = z.infer<typeof updateRoomSchema>;
