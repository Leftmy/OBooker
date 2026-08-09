import request from 'supertest';
import { app } from '../../src/app';
import { prisma } from '../../src/database/prisma.service';

describe('Bookings Integration Tests (HTTP)', () => {
  let testUser1: { id: string; email: string };
  let testUser2: { id: string; email: string };
  let testRoom: { id: string; name: string };

  const getTomorrowAt = (hours: number, minutes: number = 0): string => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(hours, minutes, 0, 0);
    return d.toISOString();
  };

  const getPastAt = (hours: number, minutes: number = 0): string => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    d.setHours(hours, minutes, 0, 0);
    return d.toISOString();
  };

  beforeAll(async () => {
    await prisma.booking.deleteMany();
    await prisma.room.deleteMany();
    await prisma.user.deleteMany({ where: { email: { in: ['user1@test.com', 'user2@test.com'] } } });

    testUser1 = await prisma.user.create({
      data: {
        name: 'Test User 1',
        email: 'user1@test.com',
        password: 'hashedpassword123',
      },
    });

    testUser2 = await prisma.user.create({
      data: {
        name: 'Test User 2',
        email: 'user2@test.com',
        password: 'hashedpassword123',
      },
    });

    testRoom = await prisma.room.create({
      data: {
        name: 'Conference Room A',
        capacity: 10,
        floor: 1,
      },
    });
  });

  beforeEach(async () => {
    await prisma.booking.deleteMany();
  });

  afterAll(async () => {
    await prisma.booking.deleteMany();
    await prisma.room.deleteMany();
    await prisma.user.deleteMany({ where: { email: { in: ['user1@test.com', 'user2@test.com'] } } });
    await prisma.$disconnect();
  });

  describe('POST /api/v1/bookings', () => {
    it('should create a booking successfully with valid data', async () => {
      const payload = {
        title: 'Team Sync',
        roomId: testRoom.id,
        userId: testUser1.id,
        startTime: getTomorrowAt(10, 0),
        endTime: getTomorrowAt(11, 0),
      };

      const response = await request(app)
        .post('/api/v1/bookings')
        .send(payload);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe('Team Sync');
      expect(response.body.roomId).toBe(testRoom.id);
    });

    it('should return 400 when title is empty', async () => {
      const payload = {
        title: '   ',
        roomId: testRoom.id,
        userId: testUser1.id,
        startTime: getTomorrowAt(10, 0),
        endTime: getTomorrowAt(11, 0),
      };

      const response = await request(app)
        .post('/api/v1/bookings')
        .send(payload);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 when time is not 30-min aligned', async () => {
      const payload = {
        title: 'Planning',
        roomId: testRoom.id,
        userId: testUser1.id,
        startTime: getTomorrowAt(10, 15),
        endTime: getTomorrowAt(11, 0),
      };

      const response = await request(app)
        .post('/api/v1/bookings')
        .send(payload);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('30-minute');
    });

    it('should return 400 when duration exceeds 4 hours', async () => {
      const payload = {
        title: 'All Day Workshop',
        roomId: testRoom.id,
        userId: testUser1.id,
        startTime: getTomorrowAt(10, 0),
        endTime: getTomorrowAt(14, 30),
      };

      const response = await request(app)
        .post('/api/v1/bookings')
        .send(payload);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('between 30 minutes and 4 hours');
    });

    it('should return 400 when booking is in the past', async () => {
      const payload = {
        title: 'Past Event',
        roomId: testRoom.id,
        userId: testUser1.id,
        startTime: getPastAt(10, 0),
        endTime: getPastAt(11, 0),
      };

      const response = await request(app)
        .post('/api/v1/bookings')
        .send(payload);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('in the future');
    });

    it('should return 400 when booking overlaps with an existing one', async () => {
      await prisma.booking.create({
        data: {
          title: 'Existing Booking',
          roomId: testRoom.id,
          userId: testUser1.id,
          startTime: new Date(getTomorrowAt(10, 0)),
          endTime: new Date(getTomorrowAt(11, 0)),
        },
      });

      const payload = {
        title: 'Conflicting Booking',
        roomId: testRoom.id,
        userId: testUser2.id,
        startTime: getTomorrowAt(10, 30),
        endTime: getTomorrowAt(11, 30),
      };

      const response = await request(app)
        .post('/api/v1/bookings')
        .send(payload);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('already booked');
    });

    it('should allow adjacent (back-to-back) bookings', async () => {
      await prisma.booking.create({
        data: {
          title: 'Slot 1',
          roomId: testRoom.id,
          userId: testUser1.id,
          startTime: new Date(getTomorrowAt(10, 0)),
          endTime: new Date(getTomorrowAt(11, 0)),
        },
      });

      const payload = {
        title: 'Slot 2',
        roomId: testRoom.id,
        userId: testUser2.id,
        startTime: getTomorrowAt(11, 0),
        endTime: getTomorrowAt(12, 0),
      };

      const response = await request(app)
        .post('/api/v1/bookings')
        .send(payload);

      expect(response.status).toBe(201);
    });
  });

  describe('GET /api/v1/bookings', () => {
    it('should return a list of bookings and support query filters', async () => {
      await prisma.booking.create({
        data: {
          title: 'Booking A',
          roomId: testRoom.id,
          userId: testUser1.id,
          startTime: new Date(getTomorrowAt(9, 0)),
          endTime: new Date(getTomorrowAt(10, 0)),
        },
      });

      const response = await request(app)
        .get(`/api/v1/bookings?roomId=${testRoom.id}`)
        .send();

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(1);
      expect(response.body[0].title).toBe('Booking A');
    });
  });

  describe('GET /api/v1/bookings/:id', () => {
    it('should return booking by id', async () => {
      const created = await prisma.booking.create({
        data: {
          title: 'Single Booking',
          roomId: testRoom.id,
          userId: testUser1.id,
          startTime: new Date(getTomorrowAt(14, 0)),
          endTime: new Date(getTomorrowAt(15, 0)),
        },
      });

      const response = await request(app)
        .get(`/api/v1/bookings/${created.id}`)
        .send();

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(created.id);
    });

    it('should return 404 for non-existent booking id', async () => {
      const response = await request(app)
        .get('/api/v1/bookings/non-existent-id')
        .send();

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/v1/bookings/:id', () => {
    it('should allow owner to cancel booking', async () => {
      const created = await prisma.booking.create({
        data: {
          title: 'To Be Cancelled',
          roomId: testRoom.id,
          userId: testUser1.id,
          startTime: new Date(getTomorrowAt(16, 0)),
          endTime: new Date(getTomorrowAt(17, 0)),
        },
      });

      const response = await request(app)
        .delete(`/api/v1/bookings/${created.id}`)
        .send({ userId: testUser1.id });

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('cancelled successfully');
    });

    it('should reject cancellation from non-owner', async () => {
      const created = await prisma.booking.create({
        data: {
          title: 'User 1 Booking',
          roomId: testRoom.id,
          userId: testUser1.id,
          startTime: new Date(getTomorrowAt(16, 0)),
          endTime: new Date(getTomorrowAt(17, 0)),
        },
      });

      const response = await request(app)
        .delete(`/api/v1/bookings/${created.id}`)
        .send({ userId: testUser2.id });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('permission');
    });
  });
});
