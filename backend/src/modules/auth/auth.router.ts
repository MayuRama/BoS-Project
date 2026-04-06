import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import prisma from '../../config/database';
import { verifyJWT } from '../../middleware/auth';

const router = Router();

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username, password } = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { username },
      include: { dealer: { select: { id: true, name: true, status: true } } },
    });

    if (!user || !user.isActive) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    // Update last login
    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

    const payload = {
      userId: user.id,
      username: user.username,
      role: user.role,
      dealerId: user.dealerId ?? undefined,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const accessToken = jwt.sign(payload, process.env.JWT_ACCESS_SECRET!, {
      expiresIn: (process.env.JWT_ACCESS_EXPIRY || '8h') as any,
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET!, {
      expiresIn: (process.env.JWT_REFRESH_EXPIRY || '7d') as any,
    });

    res.json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        dealerId: user.dealerId,
        dealer: user.dealer,
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/refresh
router.post('/refresh', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      res.status(400).json({ error: 'Refresh token required' });
      return;
    }

    const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as {
      userId: string; username: string; role: string; dealerId?: string;
    };

    const newAccessToken = jwt.sign(
      { userId: payload.userId, username: payload.username, role: payload.role, dealerId: payload.dealerId },
      process.env.JWT_ACCESS_SECRET!,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      { expiresIn: (process.env.JWT_ACCESS_EXPIRY || '8h') as any }
    );

    res.json({ accessToken: newAccessToken });
  } catch {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

// GET /api/auth/me
router.get('/me', verifyJWT, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: {
        id: true, username: true, fullName: true, email: true,
        role: true, dealerId: true, lastLoginAt: true,
        dealer: { select: { id: true, name: true, status: true } },
      },
    });
    if (!user) { res.status(404).json({ error: 'User not found' }); return; }
    res.json(user);
  } catch (err) {
    next(err);
  }
});

export default router;
