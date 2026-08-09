// tests/unit/rooms.service.spec.ts
import { RoomsService } from '../../src/modules/rooms/rooms.service';
import { PrismaClient } from '@prisma/client';

describe('RoomsService Unit Tests', () => {
  let service: RoomsService;
  let prismaMock: any;

  beforeEach(() => {
    prismaMock = {
      room: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    service = new RoomsService(prismaMock as unknown as PrismaClient);
  });

  describe('createRoom', () => {
    it('should successfully create a room with all required fields', async () => {
      // Arrange
      const dto = { name: 'Conference', capacity: 20, floor: 2 };
      const createdRoom = { id: 'room-1', ...dto };
      
      prismaMock.room.create.mockResolvedValue(createdRoom);

      // Act
      const result = await service.create(dto);

      // Assert
      expect(prismaMock.room.create).toHaveBeenCalledWith({ data: dto });
      expect(result).toEqual(createdRoom);
    });
  });

  describe('getAllRooms', () => {
    it('should return array of rooms sorted by name', async () => {
      // Arrange
      const mockRooms = [
        { id: '1', name: 'A Room', capacity: 10, floor: 1 },
        { id: '2', name: 'B Room', capacity: 20, floor: 2 }
      ];
      prismaMock.room.findMany.mockResolvedValue(mockRooms);

      // Act
      const result = await service.getAll();

      // Assert
      expect(prismaMock.room.findMany).toHaveBeenCalledWith({
        orderBy: { name: 'asc' }
      });
      expect(result).toEqual(mockRooms);
    });
  });

  describe('getRoomById', () => {
    it('should successfully find room by ID', async () => {
      // Arrange
      const mockRoom = { id: 'room-1', name: 'A Room', capacity: 10, floor: 1 };
      prismaMock.room.findUnique.mockResolvedValue(mockRoom);

      // Act
      const result = await service.getOne('room-1');

      // Assert
      expect(prismaMock.room.findUnique).toHaveBeenCalledWith({ where: { id: 'room-1' } });
      expect(result).toEqual(mockRoom);
    });

    it('should throw "Room not found" if room does not exist', async () => {
      // Arrange
      prismaMock.room.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.getOne('invalid-id')).rejects.toThrow('Room not found');
    });
  });

  describe('updateRoom', () => {
    it('should successfully update room if it exists', async () => {
      // Arrange
      const mockRoom = { id: 'room-1', name: 'A Room', capacity: 10, floor: 1 };
      prismaMock.room.findUnique.mockResolvedValue(mockRoom);
      
      const updateData = { capacity: 15 };
      const updatedRoom = { ...mockRoom, ...updateData };
      prismaMock.room.update.mockResolvedValue(updatedRoom);

      // Act
      const result = await service.update('room-1', updateData);

      // Assert
      expect(prismaMock.room.update).toHaveBeenCalledWith({
        where: { id: 'room-1' },
        data: updateData,
      });
      expect(result).toEqual(updatedRoom);
    });

    it('should handle situation when room to update is not found', async () => {
      // Arrange
      prismaMock.room.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.update('invalid-id', { capacity: 15 })).rejects.toThrow('Room not found');
    });
  });

  describe('deleteRoom', () => {
    it('should successfully delete room if it exists', async () => {
      // Arrange
      const mockRoom = { id: 'room-1', name: 'A Room', capacity: 10, floor: 1 };
      prismaMock.room.findUnique.mockResolvedValue(mockRoom);
      prismaMock.room.delete.mockResolvedValue(mockRoom);

      // Act
      const result = await service.remove('room-1');

      // Assert
      expect(prismaMock.room.delete).toHaveBeenCalledWith({ where: { id: 'room-1' } });
      expect(result).toEqual(mockRoom);
    });

    it('should handle situation when room to delete is not found', async () => {
      // Arrange
      prismaMock.room.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.remove('invalid-id')).rejects.toThrow('Room not found');
    });
  });
});
