import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../../config/database';
import { verifyJWT, requireCB } from '../../middleware/auth';
import { getPageParams, paginate } from '../../utils/helpers';

const router = Router();
router.use(verifyJWT, requireCB);

// GET /api/audit-logs
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit, skip } = getPageParams(req.query);
    const { entity, action, search } = req.query;

    const where: Record<string, unknown> = {};
    if (entity) where.entity = entity;
    if (action) where.action = action;
    if (search) {
      where.OR = [
        { actorName: { contains: String(search), mode: 'insensitive' } },
        { details: { contains: String(search), mode: 'insensitive' } },
      ];
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where, skip, take: limit,
        orderBy: { timestamp: 'desc' },
      }),
      prisma.auditLog.count({ where }),
    ]);

    res.json(paginate(logs, total, page, limit));
  } catch (err) { next(err); }
});

// GET /api/audit-logs/:id
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const log = await prisma.auditLog.findUnique({ where: { id: req.params.id } });
    if (!log) { res.status(404).json({ error: 'Log not found' }); return; }
    res.json(log);
  } catch (err) { next(err); }
});

export default router;
