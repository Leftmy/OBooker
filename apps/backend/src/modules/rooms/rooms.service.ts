import { PrismaClient } from '@prisma/client';
import { CreateRoomDto, UpdateRoomDto } from './dto/create-room.dto';

export class RoomsService {
  constructor(private prisma: PrismaClient) {}

  async create(data: CreateRoomDto) {
    return this.prisma.room.create({ data });
  }

  async getAll() {
    return this.prisma.room.findMany({
      orderBy: { name: 'asc' },
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
