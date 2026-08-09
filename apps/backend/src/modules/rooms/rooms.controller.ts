import { Request, Response, NextFunction } from 'express';
import { RoomsService } from './rooms.service';
import { createRoomSchema, updateRoomSchema } from './dto/create-room.dto';
import { prisma } from '../../database/prisma.service';

export class RoomsController {
  private roomsService: RoomsService;

  constructor() {
    this.roomsService = new RoomsService(prisma);
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const parseResult = createRoomSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ error: parseResult.error.issues[0].message });
      }
      const room = await this.roomsService.create(parseResult.data);
      res.status(201).json(room);
    } catch (error) {
      next(error);
    }
  }

  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const rooms = await this.roomsService.getAll();
      res.status(200).json(rooms);
    } catch (error) {
      next(error);
    }
  }

  async getOne(req: Request, res: Response, next: NextFunction) {
    try {
      const room = await this.roomsService.getOne(req.params.id);
      res.status(200).json(room);
    } catch (error: any) {
      if (error.message === 'Room not found') {
        return res.status(404).json({ error: error.message });
      }
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const parseResult = updateRoomSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ error: parseResult.error.issues[0].message });
      }
      const room = await this.roomsService.update(req.params.id, parseResult.data);
      res.status(200).json(room);
    } catch (error: any) {
      if (error.message === 'Room not found') {
        return res.status(404).json({ error: error.message });
      }
      next(error);
    }
  }

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      await this.roomsService.remove(req.params.id);
      res.status(200).json({ message: 'Room deleted successfully' });
    } catch (error: any) {
      if (error.message === 'Room not found') {
        return res.status(404).json({ error: error.message });
      }
      next(error);
    }
  }
}
