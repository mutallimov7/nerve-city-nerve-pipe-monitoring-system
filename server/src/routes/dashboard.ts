import { Router, Request, Response } from 'express';
import { db } from '../db';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  const devices = db.get('devices').value();
  const issues = db.get('issues').value();
  const alerts = db.get('alerts').value();
  const onlineDevices = devices.filter((d: any) => d.isOnline);
  const safe = devices.filter((d: any) => d.currentStatus === 'SAFE').length;
  const warning = devices.filter((d: any) => d.currentStatus === 'WARNING').length;
  const critical = devices.filter((d: any) => d.currentStatus === 'CRITICAL').length;
  const offline = devices.filter((d: any) => !d.isOnline).length;
  const activeIssues = issues.filter((i: any) => !['Resolved','Rejected','Archived'].includes(i.status)).length;
  const delayedIssues = issues.filter((i: any) => i.deadline && new Date(i.deadline) < new Date() && !['Resolved','Rejected','Archived'].includes(i.status)).length;
  const latestAlerts = [...alerts].sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 10);
  const avg = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
  res.json({
    success: true,
    summary: {
      totalDevices: devices.length, safe, warning, critical, offline,
      activeIssues, delayedIssues, latestAlerts,
      avgVibration: +avg(onlineDevices.map((d: any) => d.latestVibrationLevel)).toFixed(1),
      avgAcousticLevel: +avg(onlineDevices.map((d: any) => d.latestAcousticLevel)).toFixed(1),
      avgTemperature: +avg(onlineDevices.map((d: any) => d.latestTemperature)).toFixed(1),
      avgHumidity: +avg(onlineDevices.map((d: any) => d.latestHumidity)).toFixed(1),
      avgBattery: +avg(onlineDevices.map((d: any) => d.latestBattery)).toFixed(1),
      latestUpdateTime: new Date().toISOString(),
      networkHealthPct: devices.length ? Math.round(((safe + warning) / devices.length) * 100) : 100,
    },
  });
});

export default router;
