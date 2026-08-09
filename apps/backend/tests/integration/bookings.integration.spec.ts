// tests/integration/bookings.integration.spec.ts
import request from 'supertest';
import { app } from '../../src/app';
import { prisma } from '../../src/database/prisma.service';

describe('Bookings API Integration Tests', () => {
  let authCookie: string;
  let testUserId: string;
  let testRoomId: string;

  beforeAll(async () => {
    await prisma.booking.deleteMany();
    await prisma.user.deleteMany({ where: { email: 'booking.test@example.com' } });
    await prisma.room.deleteMany({ where: { name: 'Test Conference Room' } });

    const room = await prisma.room.create({
      data: { name: 'Test Conference Room', capacity: 10, floor: 1 },
    });
    testRoomId = room.id;

    const regRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Booking Tester',
        email: 'booking.test@example.com',
        password: 'Password123!',
      });

    testUserId = regRes.body.id;

    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'booking.test@example.com',
        password: 'Password123!',
      });

    const cookies = loginRes.headers['set-cookie'];
    authCookie = Array.isArray(cookies) ? cookies[0] : cookies;
  });

  afterAll(async () => {
    await prisma.booking.deleteMany();
    await prisma.user.deleteMany({ where: { id: testUserId } });
    await prisma.room.deleteMany({ where: { id: testRoomId } });
    await prisma.$disconnect();
  });

  describe('POST /api/v1/bookings', () => {
    it('should fail with 401 when request is unauthenticated', async () => {
      await request(app)
        .post('/api/v1/bookings')
        .send({
          title: 'Team Sync',
          roomId: testRoomId,
          startTime: '2026-09-01T10:00:00Z',
          endTime: '2026-09-01T12:00:00Z',
        })
        .expect(401);
    });

    it('should create booking and return 201 when payload is valid', async () => {
      const response = await request(app)
        .post('/api/v1/bookings')
        .set('Cookie', [authCookie])
        .send({
          title: 'Team Sync',
          roomId: testRoomId,
          startTime: '2026-09-01T10:00:00Z',
          endTime: '2026-09-01T12:00:00Z',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.roomId).toBe(testRoomId);
      expect(response.body.title).toBe('Team Sync');
    });

    it('should fail with 409 when booking time overlaps with an existing booking', async () => {
      const response = await request(app)
        .post('/api/v1/bookings')
        .set('Cookie', [authCookie])
        .send({
          title: 'Overlapping Meeting',
          roomId: testRoomId,
          startTime: '2026-09-01T11:00:00Z', // Overlaps with 10:00-12:00
          endTime: '2026-09-01T13:00:00Z',
        })
        .expect(409);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toMatch(/already booked/i);
    });

    it('should fail with 400 when startTime is after endTime', async () => {
      await request(app)
        .post('/api/v1/bookings')
        .set('Cookie', [authCookie])
        .send({
          roomId: testRoomId,
          startTime: '2026-09-01T14:00:00Z',
          endTime: '2026-09-01T12:00:00Z',
        })
        .expect(400);
    });
  });

  describe('GET /api/v1/bookings', () => {
    it('should return list of user bookings with status 200', async () => {
      const response = await request(app)
        .get('/api/v1/bookings')
        .set('Cookie', [authCookie])
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });
  });
});