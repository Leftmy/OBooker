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
    await prisma.user.deleteMany({
      where: {
        email: { in: ['booking.test@example.com', 'other.user@example.com'] },
      },
    });
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
    await prisma.user.deleteMany({
      where: {
        email: { in: ['booking.test@example.com', 'other.user@example.com'] },
      },
    });
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
          startTime: '2026-09-01T11:00:00Z',
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

describe('DELETE /api/v1/bookings/:id', () => {
    let bookingToDeleteId: string;

    beforeEach(async () => {
      // Очищаємо таблицю перед кожним тестом, щоб уникнути конфлікту Postgres EXCLUDE
      await prisma.booking.deleteMany();

      const booking = await prisma.booking.create({
        data: {
          title: 'Temporary Booking',
          userId: testUserId,
          roomId: testRoomId,
          startTime: new Date('2026-09-05T10:00:00Z'),
          endTime: new Date('2026-09-05T11:00:00Z'),
        },
      });
      bookingToDeleteId = booking.id;
    });

    it('should fail with 401 when request is unauthenticated', async () => {
      await request(app)
        .delete(`/api/v1/bookings/${bookingToDeleteId}`)
        .expect(401);
    });

    it('should fail with 404 when booking ID does not exist', async () => {
      const nonExistentUuid = '00000000-0000-0000-0000-000000000000';
      await request(app)
        .delete(`/api/v1/bookings/${nonExistentUuid}`)
        .set('Cookie', [authCookie])
        .expect(404);
    });

    it('should return 404 or 403 when user tries to delete another user booking', async () => {
      const otherUser = await prisma.user.create({
        data: {
          name: 'Other User',
          email: `other.user.${Date.now()}@example.com`,
          password: 'Password123!',
        },
      });

      const foreignBooking = await prisma.booking.create({
        data: {
          title: 'Foreign Booking',
          userId: otherUser.id,
          roomId: testRoomId,
          startTime: new Date('2026-09-06T10:00:00Z'),
          endTime: new Date('2026-09-06T11:00:00Z'),
        },
      });

      // Перевіряємо 404 (або 403, якщо контролер розрізняє чужі записи та відсутні)
      await request(app)
        .delete(`/api/v1/bookings/${foreignBooking.id}`)
        .set('Cookie', [authCookie])
        .expect((res) => {
          expect([403, 404]).toContain(res.status);
        });
    });

    it('should successfully delete booking and remove it from DB', async () => {
      await request(app)
        .delete(`/api/v1/bookings/${bookingToDeleteId}`)
        .set('Cookie', [authCookie])
        .expect((res) => {
          expect([200, 204]).toContain(res.status);
        });

      const dbBooking = await prisma.booking.findUnique({
        where: { id: bookingToDeleteId },
      });
      expect(dbBooking).toBeNull();
    });

    it('should allow creating a new booking in the freed time slot after cancellation', async () => {
      await request(app)
        .delete(`/api/v1/bookings/${bookingToDeleteId}`)
        .set('Cookie', [authCookie]);

      await request(app)
        .post('/api/v1/bookings')
        .set('Cookie', [authCookie])
        .send({
          title: 'Replacement Booking',
          roomId: testRoomId,
          startTime: '2026-09-05T10:00:00Z',
          endTime: '2026-09-05T11:00:00Z',
        })
        .expect(201);
    });
  });
});