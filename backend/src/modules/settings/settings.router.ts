import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../../config/database';
import { verifyJWT, requireCB } from '../../middleware/auth';

const router = Router();
router.use(verifyJWT, requireCB);

// GET /api/settings
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const settings = await prisma.systemSetting.findMany({ orderBy: { category: 'asc' } });
    res.json(settings);
  } catch (err) { next(err); }
});

// GET /api/settings/:key
router.get('/:key', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const setting = await prisma.systemSetting.findUnique({ where: { key: req.params.key } });
    if (!setting) { res.status(404).json({ error: 'Setting not found' }); return; }
    res.json(setting);
  } catch (err) { next(err); }
});

// PUT /api/settings/:key
router.put('/:key', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { value } = z.object({ value: z.string() }).parse(req.body);
    const setting = await prisma.systemSetting.update({
      where: { key: req.params.key },
      data: { value, updatedBy: req.user!.username },
    });
    res.json(setting);
  } catch (err) { next(err); }
});

// PUT /api/settings (bulk update)
router.put('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const updates = z.array(z.object({ key: z.string(), value: z.string() })).parse(req.body);
    const results = await Promise.all(
      updates.map(u =>
        prisma.systemSetting.update({
          where: { key: u.key },
          data: { value: u.value, updatedBy: req.user!.username },
        })
      )
    );
    res.json(results);
  } catch (err) { next(err); }
});

export default router;
