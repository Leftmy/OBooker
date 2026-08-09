// tests/integration/rooms.integration.spec.ts
import request from 'supertest';
import { app } from '../../src/app';
import { prisma } from '../../src/database/prisma.service';

describe('Rooms API Integration Tests', () => {
  let authCookie: string;
  let testUserId: string;
  let createdRoomId: string;

  beforeAll(async () => {
    // Cleanup any existing data that might conflict
    await prisma.booking.deleteMany();
    await prisma.user.deleteMany({ where: { email: 'rooms.tester@example.com' } });
    await prisma.room.deleteMany({ where: { name: { startsWith: 'Integration Test Room' } } });

    // Register a test user
    const regRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Rooms Tester',
        email: 'rooms.tester@example.com',
        password: 'Password123!',
      });

    testUserId = regRes.body.id;

    // Login to get the cookie
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'rooms.tester@example.com',
        password: 'Password123!',
      });

    const cookies = loginRes.headers['set-cookie'];
    authCookie = Array.isArray(cookies) ? cookies[0] : cookies;
  });

  afterAll(async () => {
    // Cleanup everything
    await prisma.booking.deleteMany();
    await prisma.user.deleteMany({ where: { id: testUserId } });
    await prisma.room.deleteMany({ where: { name: { startsWith: 'Integration Test Room' } } });
    await prisma.$disconnect();
  });

  describe('POST /api/v1/rooms', () => {
    it('should fail with 401 when request is unauthenticated', async () => {
      // Arrange
      const roomPayload = { name: 'Integration Test Room 1', capacity: 10, floor: 1 };

      // Act & Assert
      await request(app)
        .post('/api/v1/rooms')
        .send(roomPayload)
        .expect(401);
    });

    it('should create room and return 201 when payload is valid', async () => {
      // Arrange
      const roomPayload = { name: 'Integration Test Room 1', capacity: 10, floor: 1 };

      // Act
      const response = await request(app)
        .post('/api/v1/rooms')
        .set('Cookie', [authCookie])
        .send(roomPayload)
        .expect(201);

      // Assert
      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe('Integration Test Room 1');
      expect(response.body.capacity).toBe(10);
      expect(response.body.floor).toBe(1);

      createdRoomId = response.body.id;
    });

    it('should fail with 400 Bad Request when missing mandatory fields', async () => {
      // Arrange
      const invalidPayload = { name: 'Integration Test Room 2', capacity: 10 }; // Missing floor

      // Act & Assert
      await request(app)
        .post('/api/v1/rooms')
        .set('Cookie', [authCookie])
        .send(invalidPayload)
        .expect(400);
    });

    it('should fail with 400 Bad Request for negative capacity', async () => {
      // Arrange
      const invalidPayload = { name: 'Integration Test Room 3', capacity: -5, floor: 1 };

      // Act & Assert
      await request(app)
        .post('/api/v1/rooms')
        .set('Cookie', [authCookie])
        .send(invalidPayload)
        .expect(400);
    });
  });

  describe('GET /api/v1/rooms', () => {
    it('should return list of all rooms with status 200', async () => {
      // Act
      const response = await request(app)
        .get('/api/v1/rooms')
        .set('Cookie', [authCookie])
        .expect(200);

      // Assert
      expect(Array.isArray(response.body)).toBe(true);
      const room = response.body.find((r: any) => r.id === createdRoomId);
      expect(room).toBeDefined();
    });
  });

  describe('GET /api/v1/rooms/:id', () => {
    it('should return a room with status 200 for existing ID', async () => {
      // Act
      const response = await request(app)
        .get(`/api/v1/rooms/${createdRoomId}`)
        .set('Cookie', [authCookie])
        .expect(200);

      // Assert
      expect(response.body.id).toBe(createdRoomId);
      expect(response.body.name).toBe('Integration Test Room 1');
    });

    it('should return 404 Not Found for non-existing ID', async () => {
      // Act & Assert
      await request(app)
        .get('/api/v1/rooms/00000000-0000-0000-0000-000000000000') // Fake UUID
        .set('Cookie', [authCookie])
        .expect(404);
    });
  });

  describe('PATCH /api/v1/rooms/:id', () => {
    it('should update room partially and return 200', async () => {
      // Arrange
      const updatePayload = { capacity: 25 };

      // Act
      const response = await request(app)
        .patch(`/api/v1/rooms/${createdRoomId}`)
        .set('Cookie', [authCookie])
        .send(updatePayload)
        .expect(200);

      // Assert
      expect(response.body.id).toBe(createdRoomId);
      expect(response.body.capacity).toBe(25);
      expect(response.body.name).toBe('Integration Test Room 1'); // Remains unchanged
    });

    it('should return 404 Not Found for non-existing ID', async () => {
      // Arrange
      const updatePayload = { capacity: 25 };

      // Act & Assert
      await request(app)
        .patch('/api/v1/rooms/00000000-0000-0000-0000-000000000000') // Fake UUID
        .set('Cookie', [authCookie])
        .send(updatePayload)
        .expect(404);
    });
  });

  describe('DELETE /api/v1/rooms/:id', () => {
    it('should delete room and return 200 for successful deletion', async () => {
      // Act & Assert
      await request(app)
        .delete(`/api/v1/rooms/${createdRoomId}`)
        .set('Cookie', [authCookie])
        .expect(200);
    });

    it('should return 404 Not Found when trying to delete already deleted room', async () => {
      // Act & Assert
      await request(app)
        .delete(`/api/v1/rooms/${createdRoomId}`)
        .set('Cookie', [authCookie])
        .expect(404);
    });
  });
});
