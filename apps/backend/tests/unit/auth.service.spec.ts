import { AuthService } from '../../src/modules/auth/auth.service';
import bcrypt from 'bcryptjs';

// Mock bcryptjs, to avoid wasting time on encrtypting while perfoming a unit-tests
jest.mock('bcryptjs');

describe('AuthService Unit Tests', () => {
  let authService: AuthService;
  let mockPrisma: any;

  beforeEach(() => {
    // Arrange: mock Prisma Client
    mockPrisma = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
    };

    authService = new AuthService(mockPrisma);
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should successfully register a new user with normalized email and hashed password', async () => {
      // Arrange
      const registerDto = {
        name: 'Олесь',
        email: '  Test.User@Example.com ',
        password: 'securepassword123',
      };

      const normalizedEmail = 'test.user@example.com';
      const hashedPassword = 'hashed_password_mock';

      mockPrisma.user.findUnique.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      mockPrisma.user.create.mockResolvedValue({
        id: 'user-uuid-1',
        name: registerDto.name,
        email: normalizedEmail,
        createdAt: new Date(),
      });

      // Act
      const result = await authService.register(registerDto);

      // Assert
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: normalizedEmail },
      });
      expect(bcrypt.hash).toHaveBeenCalledWith(registerDto.password, 10);
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: {
          name: registerDto.name,
          email: normalizedEmail,
          password: hashedPassword,
        },
      });
      expect(result).toHaveProperty('id', 'user-uuid-1');
      expect(result).not.toHaveProperty('password'); // Password should not be returned
    });

    it('should throw an error if email is already taken', async () => {
      // Arrange
      const registerDto = {
        name: 'Олесь',
        email: 'existing@example.com',
        password: 'password123',
      };

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'existing-id',
        email: 'existing@example.com',
      });

      // Act & Assert
      await expect(authService.register(registerDto)).rejects.toThrow(
        'User with this email already exists!'
      );
      expect(mockPrisma.user.create).not.toHaveBeenCalled();
    });
  });
});