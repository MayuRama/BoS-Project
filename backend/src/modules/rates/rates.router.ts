import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../../config/database';
import { verifyJWT, requireCB, optionalJWT } from '../../middleware/auth';
import { emitRateUpdated } from '../../socket/socket';

const router = Router();

// GET /api/rates/controls — public read
router.get('/controls', optionalJWT, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const control = await prisma.rateControl.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(control);
  } catch (err) { next(err); }
});

// PUT /api/rates/controls (CB only)
router.put('/controls', verifyJWT, requireCB, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = z.object({
      buyFloor: z.number(),
      buyCeiling: z.number(),
      sellFloor: z.number(),
      sellCeiling: z.number(),
      maxSpreadPct: z.number(),
      marketRef: z.number(),
    }).parse(req.body);

    // Deactivate old controls
    await prisma.rateControl.updateMany({ where: { isActive: true }, data: { isActive: false } });

    const control = await prisma.rateControl.create({
      data: { ...data, updatedBy: req.user!.username, isActive: true },
    });

    emitRateUpdated(control);
    res.json(control);
  } catch (err) { next(err); }
});

// GET /api/rates/history
router.get('/history', optionalJWT, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const days = parseInt(String(req.query.days || '30'));
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const history = await prisma.rateHistory.findMany({
      where: { date: { gte: since } },
      orderBy: { date: 'asc' },
    });
    res.json(history);
  } catch (err) { next(err); }
});

// POST /api/rates/history — append a snapshot
router.post('/history', verifyJWT, requireCB, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = z.object({
      date: z.string(),
      buyRate: z.number(),
      sellRate: z.number(),
      marketRef: z.number(),
    }).parse(req.body);

    const entry = await prisma.rateHistory.upsert({
      where: { date: new Date(data.date) },
      create: { ...data, date: new Date(data.date) },
      update: { buyRate: data.buyRate, sellRate: data.sellRate, marketRef: data.marketRef },
    });
    res.json(entry);
  } catch (err) { next(err); }
});

export default router;
