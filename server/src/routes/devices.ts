import { Router, Request, Response } from 'express';
import { db } from '../db';
import { emitSensorUpdate } from '../socket/socketHandler';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  res.json({ success: true, devices: db.get('devices').value() });
});

router.get('/:deviceId', (req: Request, res: Response) => {
  const device = db.get('devices').find({ deviceId: req.params.deviceId }).value();
  if (!device) return res.status(404).json({ success: false, error: 'Device not found' });
  res.json({ success: true, device });
});

router.get('/:deviceId/readings', (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 100;
  const readings = db.get('sensorReadings').filter({ deviceId: req.params.deviceId }).value()
    .sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    .slice(-limit);
  res.json({ success: true, readings });
});

router.post('/:deviceId/offline', (req: Request, res: Response) => {
  const device = db.get('devices').find({ deviceId: req.params.deviceId }).value();
  if (!device) return res.status(404).json({ success: false, error: 'Device not found' });
  db.get('devices').find({ deviceId: req.params.deviceId }).assign({ isOnline: false, currentStatus: 'OFFLINE', lastUpdate: new Date().toISOString() }).write();
  const updated = db.get('devices').find({ deviceId: req.params.deviceId }).value();
  emitSensorUpdate({ device: updated });
  res.json({ success: true });
});

router.post('/:deviceId/online', (req: Request, res: Response) => {
  const device = db.get('devices').find({ deviceId: req.params.deviceId }).value();
  if (!device) return res.status(404).json({ success: false, error: 'Device not found' });
  db.get('devices').find({ deviceId: req.params.deviceId }).assign({ isOnline: true, currentStatus: 'SAFE', lastUpdate: new Date().toISOString() }).write();
  const updated = db.get('devices').find({ deviceId: req.params.deviceId }).value();
  emitSensorUpdate({ device: updated });
  res.json({ success: true });
});

router.put('/:deviceId', (req: Request, res: Response) => {
  const device = db.get('devices').find({ deviceId: req.params.deviceId }).value();
  if (!device) return res.status(404).json({ success: false, error: 'Device not found' });
  db.get('devices').find({ deviceId: req.params.deviceId }).assign({ ...req.body, deviceId: req.params.deviceId }).write();
  res.json({ success: true, device: db.get('devices').find({ deviceId: req.params.deviceId }).value() });
});

export default router;
