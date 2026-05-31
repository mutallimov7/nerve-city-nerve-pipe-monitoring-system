import low from 'lowdb';
import FileSync from 'lowdb/adapters/FileSync';
import path from 'path';
import fs from 'fs';
import { DatabaseSchema } from './models/schema';

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const adapter = new FileSync<DatabaseSchema>(path.join(dataDir, 'nerve-db.json'));
export const db = low(adapter);

const defaultSettings = {
  demoMode: true,
  esp32Mode: false,
  vibrationCriticalThreshold: 80,
  vibrationWarningThreshold: 60,
  acousticCriticalThreshold: 75,
  acousticWarningThreshold: 50,
  temperatureFreezeCritical: 0,
  temperatureFreezeWarning: 2,
  humidityHighThreshold: 85,
  humidityWarningThreshold: 70,
  batteryLowThreshold: 20,
  batteryWarningThreshold: 10,
  signalWeakThreshold: -80,
  notificationsEnabled: true,
};

export function initDb(): void {
  db.defaults({
    devices: [],
    sensorReadings: [],
    alerts: [],
    issues: [],
    citizenReports: [],
    departments: [],
    settings: defaultSettings,
  }).write();
}
