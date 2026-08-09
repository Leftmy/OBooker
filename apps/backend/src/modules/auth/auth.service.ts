import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { normalizeEmail } from './auth.utils';

export class AuthService {
  constructor(private prisma: PrismaClient) {}

  async register(dto: RegisterDto) {
    const email = normalizeEmail(dto.email);

    const existingUser = await this.prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        name: dto.name.trim(),
        email,
        password: hashedPassword,
      },
    });

    const { password: _password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async login(dto: LoginDto) {
    const email = normalizeEmail(dto.email);

    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user || !(await bcrypt.compare(dto.password, user.password))) {
      throw new Error('Wrong email or password');
    }

    const { password: _password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new Error('User not found');
    }

    const { password: _password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}