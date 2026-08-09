import request from 'supertest';
import { app } from '../../src/app'; 
import { prisma } from '../../src/database/prisma.service';

describe('Auth API Integration Tests', () => {
  const testUser = {
    name: 'Integration User',
    email: 'integration.test@example.com',
    password: 'Password123!',
  };

  beforeAll(async () => {
    // Clean up test user if it exists prior to running tests
    await prisma.user.deleteMany({
      where: {
        email: testUser.email.toLowerCase(),
      },
    });
  });

  afterAll(async () => {
    // Clean up test user and disconnect Prisma client
    await prisma.user.deleteMany({
      where: {
        email: testUser.email.toLowerCase(),
      },
    });
    await prisma.$disconnect();
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user successfully and return 201', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(testUser)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('email', testUser.email.toLowerCase());
      expect(response.body).toHaveProperty('name', testUser.name);
      expect(response.body).not.toHaveProperty('password');
    });

    it('should fail with 400/409 when registering with an existing email (case-insensitive)', async () => {
      const duplicateUser = {
        name: 'Another Name',
        email: '  INTEGRATION.TEST@EXAMPLE.COM ', // Same email, different case and spaces
        password: 'AnotherPassword123!',
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(duplicateUser)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toMatch(/already exists/i);
    });

    it('should fail with 400 when password is too short (< 8 characters)', async () => {
      const invalidUser = {
        name: 'Short Pass User',
        email: 'shortpass@example.com',
        password: '123',
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(invalidUser)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should fail with 400 when name is missing or empty', async () => {
      const invalidUser = {
        name: '   ',
        email: 'noname@example.com',
        password: 'ValidPassword123',
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(invalidUser)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should authenticate user with valid credentials and return 200', async () => {
      const loginPayload = {
        email: '  INTEGRATION.TEST@EXAMPLE.COM ',
        password: testUser.password,
      };

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(loginPayload)
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body.email).toBe(testUser.email.toLowerCase());
      expect(response.body).not.toHaveProperty('password');
    });

    it('should fail with 401/400 when password is incorrect', async () => {
      const invalidPayload = {
        email: testUser.email,
        password: 'WrongPassword123',
      };

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(invalidPayload)
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toMatch(/wrong email or password/i);
    });

    it('should fail with 401/400 when user does not exist', async () => {
      const nonexistentPayload = {
        email: 'nonexistent.user@example.com',
        password: 'Password123!',
      };

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(nonexistentPayload)
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toMatch(/wrong email or password/i);
    });
  });
});