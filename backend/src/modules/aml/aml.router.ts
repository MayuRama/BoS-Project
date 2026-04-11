import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../../config/database';
import { verifyJWT, requireCB } from '../../middleware/auth';
import { getPageParams, paginate } from '../../utils/helpers';

const router = Router();
router.use(verifyJWT, requireCB);

// GET /api/aml-alerts
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit, skip } = getPageParams(req.query);
    const { status, priority, dealerId } = req.query;

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (dealerId) where.dealerId = dealerId;

    const [alerts, total] = await Promise.all([
      prisma.aMLAlert.findMany({
        where, skip, take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          dealer: { select: { id: true, name: true } },
          transactions: {
            include: {
              transaction: {
                select: {
                  id: true, refNumber: true, type: true,
                  amountUSD: true, mobileNumber: true,
                  telcoOperator: true, walletType: true, timestamp: true,
                },
              },
            },
          },
        },
      }),
      prisma.aMLAlert.count({ where }),
    ]);

    res.json(paginate(alerts, total, page, limit));
  } catch (err) { next(err); }
});

// GET /api/aml-alerts/:id
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const alert = await prisma.aMLAlert.findUnique({
      where: { id: req.params.id },
      include: {
        dealer: true,
        transactions: {
          include: { transaction: true },
        },
      },
    });
    if (!alert) { res.status(404).json({ error: 'Alert not found' }); return; }
    res.json(alert);
  } catch (err) { next(err); }
});

// PATCH /api/aml-alerts/:id/status
router.patch('/:id/status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status } = z.object({
      status: z.enum(['New', 'UnderReview', 'Resolved']),
    }).parse(req.body);

    const alert = await prisma.aMLAlert.update({
      where: { id: req.params.id },
      data: {
        status,
        ...(status === 'Resolved' ? { resolvedBy: req.user!.username, resolvedAt: new Date() } : {}),
      },
    });
    res.json(alert);
  } catch (err) { next(err); }
});

// PATCH /api/aml-alerts/:id/notes
router.patch('/:id/notes', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { notes } = z.object({ notes: z.string() }).parse(req.body);
    const alert = await prisma.aMLAlert.update({
      where: { id: req.params.id },
      data: { notes },
    });
    res.json(alert);
  } catch (err) { next(err); }
});

export default router;
