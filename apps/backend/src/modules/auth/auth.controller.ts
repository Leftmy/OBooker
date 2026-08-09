import { Request, Response } from 'express';
import { AuthService } from './auth.service';

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  register = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = await this.authService.register(req.body);
      res.status(201).json(user);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  login = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = await this.authService.login(req.body);
      res.status(200).json(user);
    } catch (error: any) {
      res.status(401).json({ error: error.message });
    }
  };

  logout = async (_req: Request, res: Response): Promise<void> => {
    res.status(200).json({ message: 'Logged out successfully' });
  };
}