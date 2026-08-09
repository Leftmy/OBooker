import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { normalizeEmail, validatePassword } from './auth.utils';

export class AuthService {
  constructor(private prisma: PrismaClient) {}

  async register(dto: RegisterDto) {
    const email = normalizeEmail(dto.email);

    if (!dto.name || !dto.name.trim()) {
      throw new Error('Name is required');
    }

    if (!validatePassword(dto.password)) {
      throw new Error('Password length should be between 8 and 72 symbols');
    }

    const existingUser = await this.prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new Error('User with this email already exists!');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        name: dto.name.trim(),
        email,
        password: hashedPassword,
      },
    });

    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async login(loginDto: LoginDto) {
    const normalizedEmail = normalizeEmail(loginDto.email);

    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      throw new Error('Wrong email or password');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);

    if (!isPasswordValid) {
      throw new Error('Wrong email or password');
    }

    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}