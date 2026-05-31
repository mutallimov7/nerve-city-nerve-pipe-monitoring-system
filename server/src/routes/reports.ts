import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';

const router = Router();

const genCode = () => 'NRV-' + Math.random().toString(36).substr(2, 8).toUpperCase();

router.post('/', (req: Request, res: Response) => {
  const report = {
    reportId: uuidv4(), trackingCode: genCode(),
    category: req.body.category || 'Other', description: req.body.description || '',
    photoUrl: req.body.photoUrl || null, latitude: req.body.latitude || null, longitude: req.body.longitude || null,
    address: req.body.address || '', urgency: req.body.urgency || 'MEDIUM',
    status: 'Submitted', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  };
  db.get('citizenReports').push(report).write();
  res.json({ success: true, report, trackingCode: report.trackingCode });
});

router.get('/:trackingCode', (req: Request, res: Response) => {
  const report = db.get('citizenReports').find({ trackingCode: req.params.trackingCode }).value();
  if (!report) return res.status(404).json({ success: false, error: 'Report not found' });
  res.json({ success: true, report });
});

router.get('/', (_req: Request, res: Response) => {
  const reports = db.get('citizenReports').value()
    .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json({ success: true, reports });
});

export default router;
