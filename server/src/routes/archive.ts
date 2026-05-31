import { Router, Request, Response } from 'express';
import { db } from '../db';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  const issues = db.get('issues').value().filter((i: any) => ['Resolved','Rejected','Archived'].includes(i.status));
  const alerts = db.get('alerts').value().filter((a: any) => a.resolved);
  res.json({ success: true, issues, alerts });
});

export default router;
