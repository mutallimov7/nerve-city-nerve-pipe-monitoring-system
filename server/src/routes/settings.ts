import { Router, Request, Response } from 'express';
import { db } from '../db';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  res.json({ success: true, settings: db.get('settings').value() });
});

router.put('/', (req: Request, res: Response) => {
  const current = db.get('settings').value();
  db.set('settings', { ...current, ...req.body }).write();
  res.json({ success: true, settings: db.get('settings').value() });
});

router.get('/departments', (_req: Request, res: Response) => {
  res.json({ success: true, departments: db.get('departments').value() });
});

router.get('/alerts', (_req: Request, res: Response) => {
  const alerts = db.get('alerts').value()
    .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 50);
  res.json({ success: true, alerts });
});

export default router;
