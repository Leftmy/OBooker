import { AuthService } from '../../src/modules/auth/auth.service';
import bcrypt from 'bcryptjs';

jest.mock('bcryptjs');

describe('AuthService Unit Tests', () => {
  let authService: AuthService;
  let mockPrisma: any;

  beforeEach(() => {
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
    // --- Happy Path Tests ---

    it('should successfully register a new user with normalized email and hashed password', async () => {
      const registerDto = {
        name: 'John Doe',
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

      const result = await authService.register(registerDto);

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
      expect(result).not.toHaveProperty('password');
    });

    // --- Failure Path Tests ---

    it('should throw an error if the email address is already taken', async () => {
      const registerDto = {
        name: 'John Doe',
        email: 'existing@example.com',
        password: 'password123',
      };

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'existing-id',
        email: 'existing@example.com',
      });

      await expect(authService.register(registerDto)).rejects.toThrow(
        'User with this email already exists'
      );
      expect(mockPrisma.user.create).not.toHaveBeenCalled();
    });

    it('should throw an error if bcrypt hashing fails internally', async () => {
      const registerDto = {
        name: 'Anna Smith',
        email: 'anna@example.com',
        password: 'password123',
      };

      mockPrisma.user.findUnique.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockRejectedValue(new Error('Bcrypt internal failure'));

      await expect(authService.register(registerDto)).rejects.toThrow('Bcrypt internal failure');
      expect(mockPrisma.user.create).not.toHaveBeenCalled();
    });

    // --- Edge Cases ---

    it('edge case: should treat uppercase and lowercase duplicate emails as the same user', async () => {
      const registerDto = {
        name: 'Ivan Franko',
        email: 'Ivan@X.com',
        password: 'password123',
      };

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-id-2',
        email: 'ivan@x.com',
      });

      await expect(authService.register(registerDto)).rejects.toThrow(
        'User with this email already exists'
      );
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'ivan@x.com' },
      });
    });

    it('edge case: should handle password on the lower boundary limit (8 characters)', async () => {
      const registerDto = {
        name: 'Peter Parker',
        email: 'peter@example.com',
        password: '12345678', // Exactly 8 characters
      };

      mockPrisma.user.findUnique.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_8chars');
      mockPrisma.user.create.mockResolvedValue({
        id: 'user-id-3',
        name: registerDto.name,
        email: 'peter@example.com',
      });

      const result = await authService.register(registerDto);

      expect(bcrypt.hash).toHaveBeenCalledWith('12345678', 10);
      expect(result).toBeDefined();
    });

    it('edge case: should handle password on the upper boundary limit (72 characters)', async () => {
      const longPassword = 'a'.repeat(72); // Exactly 72 characters limit for bcrypt
      const registerDto = {
        name: 'Mary Jane',
        email: 'mary@example.com',
        password: longPassword,
      };

      mockPrisma.user.findUnique.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_72chars');
      mockPrisma.user.create.mockResolvedValue({
        id: 'user-id-4',
        name: registerDto.name,
        email: 'mary@example.com',
      });

      const result = await authService.register(registerDto);

      expect(bcrypt.hash).toHaveBeenCalledWith(longPassword, 10);
      expect(result).toBeDefined();
    });
  });

  describe('login', () => {
    // --- Happy Path Tests ---

    it('should successfully authenticate user with correct credentials', async () => {
      const loginDto = {
        email: '  Ivan@x.com ',
        password: 'correctpassword123',
      };
      const normalizedEmail = 'ivan@x.com';
      const mockUser = {
        id: 'user-id-123',
        name: 'Ivan',
        email: normalizedEmail,
        password: 'hashed_password_in_db',
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await authService.login(loginDto);

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: normalizedEmail },
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(
        loginDto.password,
        mockUser.password
      );
      expect(result).toHaveProperty('id', 'user-id-123');
      expect(result).not.toHaveProperty('password');
    });

    // --- Failure Path Tests ---

    it('should throw an error if the user email is not found', async () => {
      const loginDto = {
        email: 'nonexistent@x.com',
        password: 'somepassword',
      };

      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(authService.login(loginDto)).rejects.toThrow(
        'Wrong email or password'
      );
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it('should throw an error if password does not match', async () => {
      const loginDto = {
        email: 'ivan@x.com',
        password: 'wrongpassword',
      };
      const mockUser = {
        id: 'user-id-123',
        name: 'Ivan',
        email: 'ivan@x.com',
        password: 'hashed_password_in_db',
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(authService.login(loginDto)).rejects.toThrow(
        'Wrong email or password'
      );
    });

    // --- Edge Cases ---

    it('edge case: should trim whitespaces and normalize case for login email', async () => {
      const loginDto = {
        email: '   iVaN@X.cOm   ',
        password: 'correctpassword123',
      };
      const mockUser = {
        id: 'user-id-123',
        name: 'Ivan',
        email: 'ivan@x.com',
        password: 'hashed_password_in_db',
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await authService.login(loginDto);

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'ivan@x.com' },
      });
    });

    it('edge case: should exclude sensitive user fields (like password) from the returned object', async () => {
      const loginDto = {
        email: 'user@x.com',
        password: 'password123',
      };
      const mockUser = {
        id: 'user-id-999',
        name: 'Daniel',
        email: 'user@x.com',
        password: 'hashed_password',
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await authService.login(loginDto);

      expect(result).toEqual({
        id: 'user-id-999',
        name: 'Daniel',
        email: 'user@x.com',
      });
    });
  });
});