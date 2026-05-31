import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';
import { calculateRisk } from '../services/riskEngine';
import {
  emitSensorUpdate, emitNewAlert, emitIssueUpdate,
  emitDashboardUpdate, emitMapUpdate,
} from '../socket/socketHandler';

const router = Router();

function buildDashboardSummary() {
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
  return {
    totalDevices: devices.length, safe, warning, critical, offline,
    activeIssues, delayedIssues, latestAlerts,
    avgVibration: +avg(onlineDevices.map((d: any) => d.latestVibrationLevel)).toFixed(1),
    avgAcousticLevel: +avg(onlineDevices.map((d: any) => d.latestAcousticLevel)).toFixed(1),
    avgTemperature: +avg(onlineDevices.map((d: any) => d.latestTemperature)).toFixed(1),
    avgHumidity: +avg(onlineDevices.map((d: any) => d.latestHumidity)).toFixed(1),
    avgBattery: +avg(onlineDevices.map((d: any) => d.latestBattery)).toFixed(1),
    latestUpdateTime: new Date().toISOString(),
    networkHealthPct: devices.length ? Math.round(((safe + warning) / devices.length) * 100) : 100,
  };
}

// Preset payloads for simulate-reading
const PRESETS: Record<string, any> = {
  normal:            { vibrationLevel:12,  acousticLevel:15,  temperature:22,   humidity:55, battery:85, signalStrength:-55, accelX:0.02,  accelY:-0.01, accelZ:9.81, rawVibration:0.012, baseline:0.021, micPeakToPeak:350,  soundStatus:'QUIET',       uptimeMs:100000, source:'simulation' },
  light_vibration:   { vibrationLevel:35,  acousticLevel:25,  temperature:21,   humidity:52, battery:82, signalStrength:-58, accelX:0.08,  accelY:-0.04, accelZ:9.81, rawVibration:0.038, baseline:0.021, micPeakToPeak:800,  soundStatus:'NORMAL SOUND',uptimeMs:110000, source:'simulation' },
  high_vibration:    { vibrationLevel:68,  acousticLevel:38,  temperature:20,   humidity:54, battery:78, signalStrength:-60, accelX:0.18,  accelY:-0.09, accelZ:9.80, rawVibration:0.074, baseline:0.021, micPeakToPeak:1500, soundStatus:'HIGH SOUND',  uptimeMs:120000, source:'simulation' },
  critical_vibration:{ vibrationLevel:88,  acousticLevel:42,  temperature:19,   humidity:56, battery:75, signalStrength:-62, accelX:0.35,  accelY:-0.18, accelZ:9.79, rawVibration:0.102, baseline:0.021, micPeakToPeak:2200, soundStatus:'HIGH SOUND',  uptimeMs:130000, source:'simulation' },
  acoustic_anomaly:  { vibrationLevel:22,  acousticLevel:82,  temperature:21,   humidity:53, battery:80, signalStrength:-57, accelX:0.04,  accelY:-0.02, accelZ:9.81, rawVibration:0.018, baseline:0.021, micPeakToPeak:3200, soundStatus:'HIGH SOUND',  uptimeMs:140000, source:'simulation' },
  mechanical_acoustic:{vibrationLevel:76,  acousticLevel:79,  temperature:20,   humidity:55, battery:77, signalStrength:-61, accelX:0.28,  accelY:-0.14, accelZ:9.80, rawVibration:0.092, baseline:0.021, micPeakToPeak:2900, soundStatus:'HIGH SOUND',  uptimeMs:150000, source:'simulation' },
  freeze_warning:    { vibrationLevel:18,  acousticLevel:12,  temperature:1.5,  humidity:62, battery:74, signalStrength:-63, accelX:0.03,  accelY:-0.01, accelZ:9.81, rawVibration:0.015, baseline:0.021, micPeakToPeak:300,  soundStatus:'QUIET',       uptimeMs:160000, source:'simulation' },
  freeze_critical:   { vibrationLevel:15,  acousticLevel:10,  temperature:-1.2, humidity:68, battery:72, signalStrength:-64, accelX:0.02,  accelY:-0.01, accelZ:9.81, rawVibration:0.012, baseline:0.021, micPeakToPeak:250,  soundStatus:'QUIET',       uptimeMs:170000, source:'simulation' },
  high_humidity:     { vibrationLevel:20,  acousticLevel:18,  temperature:18,   humidity:91, battery:76, signalStrength:-59, accelX:0.03,  accelY:-0.02, accelZ:9.81, rawVibration:0.016, baseline:0.021, micPeakToPeak:400,  soundStatus:'QUIET',       uptimeMs:180000, source:'simulation' },
  combined_critical: { vibrationLevel:82,  acousticLevel:77,  temperature:-0.5, humidity:88, battery:15, signalStrength:-83, accelX:0.31,  accelY:-0.16, accelZ:9.79, rawVibration:0.098, baseline:0.021, micPeakToPeak:2800, soundStatus:'HIGH SOUND',  uptimeMs:190000, source:'simulation' },
  low_battery:       { vibrationLevel:14,  acousticLevel:11,  temperature:22,   humidity:54, battery:8,  signalStrength:-60, accelX:0.02,  accelY:-0.01, accelZ:9.81, rawVibration:0.013, baseline:0.021, micPeakToPeak:280,  soundStatus:'QUIET',       uptimeMs:200000, source:'simulation' },
  weak_signal:       { vibrationLevel:16,  acousticLevel:13,  temperature:21,   humidity:53, battery:79, signalStrength:-87, accelX:0.03,  accelY:-0.01, accelZ:9.81, rawVibration:0.014, baseline:0.021, micPeakToPeak:310,  soundStatus:'QUIET',       uptimeMs:210000, source:'simulation' },
};

function processSensorPayload(payload: any): any {
  const { deviceId } = payload;
  if (!deviceId) return { success: false, error: 'deviceId required' };

  let device = db.get('devices').find({ deviceId }).value();
  if (!device) {
    if (db.get('settings').get('demoMode').value()) {
      const newDevice = {
        deviceId, name: `Auto-Registered ${deviceId}`, locationName: 'Unknown',
        latitude: 40.4155, longitude: 49.8582, installationType: 'Unknown',
        currentStatus: 'SAFE', currentMode: 'Normal Mode',
        latestRiskScore: 0, latestVibrationLevel: 0, latestAcousticLevel: 0,
        latestTemperature: 20, latestHumidity: 50, latestBattery: 100,
        latestSignalStrength: -50, latestActivityLevel: 'Low Activity',
        lastUpdate: new Date().toISOString(), isOnline: true,
        firmwareVersion: '1.0.0', installationDate: new Date().toISOString(),
        assignedTeam: 'Technical Sensor Maintenance Team', notes: 'Auto-registered demo device',
      };
      db.get('devices').push(newDevice).write();
      device = newDevice;
    } else {
      return { success: false, error: `Device ${deviceId} not found.` };
    }
  }

  const recentReadings = db.get('sensorReadings').filter({ deviceId }).value()
    .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 10);
  const recentRiskScores = recentReadings.map((r: any) => r.calculatedRiskScore);

  const riskInput = {
    accelX: payload.accelX ?? 0, accelY: payload.accelY ?? 0, accelZ: payload.accelZ ?? 9.81,
    rawVibration: payload.rawVibration ?? 0, vibrationLevel: payload.vibrationLevel ?? 0, baseline: payload.baseline ?? 0.02,
    acousticLevel: payload.acousticLevel ?? 0, micPeakToPeak: payload.micPeakToPeak ?? 0, soundStatus: payload.soundStatus ?? 'QUIET',
    temperature: payload.temperature ?? 20, humidity: payload.humidity ?? 50,
    battery: payload.battery ?? 100, signalStrength: payload.signalStrength ?? -50,
    recentRiskScores,
  };
  const risk = calculateRisk(riskInput);

  const reading = {
    readingId: uuidv4(), deviceId,
    ...riskInput,
    source: payload.source ?? 'simulation',
    uptimeMs: payload.uptimeMs ?? 0,
    timestamp: new Date().toISOString(),
    calculatedRiskScore: risk.riskScore, calculatedStatus: risk.status,
    calculatedMode: risk.mode, activityLevel: risk.activityLevel,
    explanation: risk.explanation, recommendedAction: risk.recommendedAction,
  };

  // Limit readings to 500
  const allReadings = db.get('sensorReadings').value();
  if (allReadings.length >= 500) {
    db.set('sensorReadings', allReadings.slice(-499)).write();
  }
  db.get('sensorReadings').push(reading).write();

  // Update device
  db.get('devices').find({ deviceId }).assign({
    currentStatus: risk.status, currentMode: risk.mode,
    latestRiskScore: risk.riskScore, latestVibrationLevel: riskInput.vibrationLevel,
    latestAcousticLevel: riskInput.acousticLevel, latestTemperature: riskInput.temperature,
    latestHumidity: riskInput.humidity, latestBattery: riskInput.battery,
    latestSignalStrength: riskInput.signalStrength, latestActivityLevel: risk.activityLevel,
    lastUpdate: new Date().toISOString(), isOnline: true,
  }).write();
  device = db.get('devices').find({ deviceId }).value();

  // Create alert if WARNING/CRITICAL
  let newAlert: any = null;
  if (risk.status === 'WARNING' || risk.status === 'CRITICAL') {
    let alertType = 'Sensor Anomaly';
    if (risk.mode.includes('Mechanical + Acoustic')) alertType = 'Combined Mechanical-Acoustic Anomaly';
    else if (risk.mode.includes('Mechanical')) alertType = 'Mechanical Anomaly';
    else if (risk.mode.includes('Acoustic')) alertType = 'Acoustic Anomaly';
    else if (risk.mode.includes('Freeze')) alertType = 'Freeze Risk';
    else if (risk.mode.includes('Humidity')) alertType = 'Humidity Risk';
    else if (risk.mode.includes('Battery')) alertType = 'Low Battery';
    else if (risk.mode.includes('Signal')) alertType = 'Weak Signal';
    newAlert = {
      alertId: uuidv4(), deviceId, alertType,
      severity: risk.status === 'CRITICAL' ? 'CRITICAL' : 'HIGH',
      message: risk.explanation, riskScore: risk.riskScore,
      status: risk.status, mode: risk.mode,
      timestamp: new Date().toISOString(), resolved: false, resolvedAt: null,
    };
    const alerts = db.get('alerts').value();
    if (alerts.length >= 200) db.set('alerts', alerts.slice(-199)).write();
    db.get('alerts').push(newAlert).write();
  }

  // Auto-create issue for CRITICAL
  if (risk.status === 'CRITICAL') {
    const existingIssue = db.get('issues').find((i: any) =>
      i.linkedDeviceId === deviceId && !['Resolved','Rejected','Archived'].includes(i.status) && i.category === risk.mode
    ).value();
    if (!existingIssue) {
      const newIssue = {
        issueId: uuidv4(), source: 'sensor', linkedDeviceId: deviceId,
        category: risk.mode, title: `${risk.mode} — ${device?.locationName || deviceId}`,
        description: risk.explanation, locationName: device?.locationName || 'Unknown',
        latitude: device?.latitude || 40.4155, longitude: device?.longitude || 49.8582,
        priority: 'CRITICAL', status: 'New', assignedDepartment: '', assignedPerson: '',
        deadline: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
        notes: [], auditLog: [{ action: 'Issue Created', by: 'System — Risk Engine', timestamp: new Date().toISOString(), detail: `Auto-created. Risk Score: ${risk.riskScore}. Mode: ${risk.mode}` }],
      };
      db.get('issues').push(newIssue).write();
      emitIssueUpdate(newIssue);
    }
  }

  emitSensorUpdate({ device, reading, risk });
  if (newAlert) emitNewAlert(newAlert);
  emitDashboardUpdate(buildDashboardSummary());
  emitMapUpdate(db.get('devices').value().map((d: any) => ({
    deviceId: d.deviceId, name: d.name, locationName: d.locationName,
    latitude: d.latitude, longitude: d.longitude,
    currentStatus: d.currentStatus, latestRiskScore: d.latestRiskScore, isOnline: d.isOnline,
  })));

  return { success: true, deviceId, riskScore: risk.riskScore, status: risk.status, mode: risk.mode, activityLevel: risk.activityLevel, explanation: risk.explanation, recommendedAction: risk.recommendedAction };
}

// POST /api/sensor-data
router.post('/sensor-data', (req: Request, res: Response) => {
  try {
    const result = processSensorPayload(req.body);
    if (!result.success) return res.status(result.error?.includes('not found') ? 404 : 400).json(result);
    return res.json(result);
  } catch (err: any) {
    console.error('[sensor-data]', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/simulate-reading
router.post('/simulate-reading', (req: Request, res: Response) => {
  try {
    const { deviceId, scenario } = req.body;
    const preset = PRESETS[scenario] || PRESETS.normal;
    const payload = { deviceId: deviceId || 'NERVE-NAR-001', ...preset };
    const result = processSensorPayload(payload);
    if (!result.success) return res.status(400).json(result);
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
