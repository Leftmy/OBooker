import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { AuthService } from './auth.service';
import { RegisterSchema } from './dto/register.dto';
import { LoginSchema } from './dto/login.dto';

const JWT_SECRET = process.env.JWT_SECRET as string;
const COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  register = async (req: Request, res: Response): Promise<void> => {
    const parsed = RegisterSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten().fieldErrors });
      return;
    }

    try {
      const user = await this.authService.register(parsed.data);
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: COOKIE_MAX_AGE_MS,
      });

      res.status(201).json(user);
    } catch (error: any) {
      res.status(409).json({ error: error.message });
    }
  };

  login = async (req: Request, res: Response): Promise<void> => {
    const parsed = LoginSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten().fieldErrors });
      return;
    }

    try {
      const user = await this.authService.login(parsed.data);
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: COOKIE_MAX_AGE_MS,
      });

      res.status(200).json(user);
    } catch (error: any) {
      res.status(401).json({ error: error.message });
    }
  };

  logout = (_req: Request, res: Response): void => {
    res.clearCookie('token');
    res.status(200).json({ message: 'Logged out successfully' });
  };

  me = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = await this.authService.me(req.user!.id);
      res.status(200).json(user);
    } catch (error: any) {
      res.status(404).json({ error: error.message });
    }
  };
}