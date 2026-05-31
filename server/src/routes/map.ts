import { Router, Request, Response } from 'express';
import { db } from '../db';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  const devices = db.get('devices').value().map((d: any) => ({ ...d, type: 'device' }));
  const activeIssues = db.get('issues').value()
    .filter((i: any) => !['Resolved','Rejected','Archived'].includes(i.status))
    .map((i: any) => ({ id: i.issueId, title: i.title, category: i.category, locationName: i.locationName, latitude: i.latitude, longitude: i.longitude, priority: i.priority, status: i.status, type: 'issue' }));
  const citizenReports = db.get('citizenReports').value()
    .map((r: any) => ({ id: r.reportId, trackingCode: r.trackingCode, category: r.category, description: r.description, latitude: r.latitude, longitude: r.longitude, address: r.address, urgency: r.urgency, status: r.status, createdAt: r.createdAt, type: 'citizen-report' }));
  res.json({ success: true, devices, activeIssues, citizenReports });
});

export default router;
