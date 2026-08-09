import { PrismaClient } from '@prisma/client';
import { CreateRoomDto, GetRoomsQueryDto, UpdateRoomDto } from './dto/create-room.dto';

export class RoomsService {
  constructor(private prisma: PrismaClient) {}

  async create(data: CreateRoomDto) {
    return this.prisma.room.create({ data });
  }

  async getAll(query?: GetRoomsQueryDto) {
    const { minCapacity, sortBy = 'name', sortOrder = 'asc' } = query || {};

    return this.prisma.room.findMany({
      where: {
        ...(minCapacity ? { capacity: { gte: minCapacity } } : {}),
      },
      orderBy: {
        [sortBy]: sortOrder,
      },
    });
  }

  async getOne(id: string) {
    const room = await this.prisma.room.findUnique({ where: { id } });
    if (!room) throw new Error('Room not found');
    return room;
  }

  async update(id: string, data: UpdateRoomDto) {
    await this.getOne(id);
    return this.prisma.room.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    await this.getOne(id);
    return this.prisma.room.delete({ where: { id } });
  }
}
