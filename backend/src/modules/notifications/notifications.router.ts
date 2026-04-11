import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../../config/database';
import { verifyJWT, requireCB } from '../../middleware/auth';
import { getPageParams, paginate } from '../../utils/helpers';
import { emitNotification } from '../../socket/socket';

const router = Router();
router.use(verifyJWT);

// GET /api/notifications
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit, skip } = getPageParams(req.query);
    const { read } = req.query;

    const where: Record<string, unknown> = {};
    if (req.user!.dealerId) {
      where.OR = [{ dealerId: req.user!.dealerId }, { dealerId: null }];
    }
    if (read !== undefined) where.read = read === 'true';

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where, skip, take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.notification.count({ where }),
    ]);

    res.json(paginate(notifications, total, page, limit));
  } catch (err) { next(err); }
});

// PATCH /api/notifications/:id/read
router.patch('/:id/read', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const notification = await prisma.notification.update({
      where: { id: req.params.id },
      data: { read: true },
    });
    res.json(notification);
  } catch (err) { next(err); }
});

// PATCH /api/notifications/read-all
router.patch('/read-all', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const where: Record<string, unknown> = {};
    if (req.user!.dealerId) where.dealerId = req.user!.dealerId;

    await prisma.notification.updateMany({ where, data: { read: true } });
    res.json({ message: 'All notifications marked as read' });
  } catch (err) { next(err); }
});

// POST /api/notifications/broadcast (CB only)
router.post('/broadcast', requireCB, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, message, type, dealerId } = z.object({
      title: z.string(),
      message: z.string(),
      type: z.enum(['OMO', 'Transaction', 'System', 'Rate', 'Settlement']),
      dealerId: z.string().optional(),
    }).parse(req.body);

    const notification = await prisma.notification.create({
      data: { title, message, type, dealerId },
    });

    emitNotification(dealerId || null, notification);
    res.status(201).json(notification);
  } catch (err) { next(err); }
});

export default router;
