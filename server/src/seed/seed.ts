import low from 'lowdb';
import FileSync from 'lowdb/adapters/FileSync';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { DatabaseSchema } from '../models/schema';

const dataDir = path.join(__dirname, '..', '..', 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const adapter = new FileSync<DatabaseSchema>(path.join(dataDir, 'nerve-db.json'));
const db = low(adapter);

const now = new Date().toISOString();

db.defaults({
  devices: [],
  sensorReadings: [],
  alerts: [],
  issues: [],
  citizenReports: [],
  departments: [],
  settings: {
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
  },
}).write();

// Reset collections
db.set('devices', []).write();
db.set('sensorReadings', []).write();
db.set('alerts', []).write();
db.set('issues', []).write();
db.set('citizenReports', []).write();
db.set('departments', []).write();

// ─── Departments ──────────────────────────────────────────────────────────────
db.get('departments').push(
  { departmentId: 'd1', name: 'Water and Sewage Utility', description: 'Manages water/sewage infrastructure', contactEmail: 'water@baku.az', contactPhone: '+994 12 001 0001' },
  { departmentId: 'd2', name: 'Road/Asphalt Repair Team', description: 'Road repair and maintenance', contactEmail: 'roads@baku.az', contactPhone: '+994 12 001 0002' },
  { departmentId: 'd3', name: 'Emergency Response Team', description: '24/7 emergency response', contactEmail: 'emergency@baku.az', contactPhone: '+994 12 001 0003' },
  { departmentId: 'd4', name: 'Lighting Department', description: 'Street lighting maintenance', contactEmail: 'lighting@baku.az', contactPhone: '+994 12 001 0004' },
  { departmentId: 'd5', name: 'Sanitation Department', description: 'Waste and sanitation services', contactEmail: 'sanitation@baku.az', contactPhone: '+994 12 001 0005' },
  { departmentId: 'd6', name: 'Environmental/Green Area Team', description: 'Parks and environment', contactEmail: 'green@baku.az', contactPhone: '+994 12 001 0006' },
  { departmentId: 'd7', name: 'Technical Sensor Maintenance Team', description: 'Maintains IoT sensor devices', contactEmail: 'sensors@baku.az', contactPhone: '+994 12 001 0007' }
).write();

// ─── Devices ──────────────────────────────────────────────────────────────────
const devices = [
  { deviceId: 'NERVE-NAR-001', name: 'Alpha-1 Nerve Node', locationName: 'Old pipe section near Narimanov Ave', latitude: 40.4155, longitude: 49.8582, installationType: 'Old pipe section', currentStatus: 'WARNING', currentMode: 'Mechanical Anomaly Mode', latestRiskScore: 58, latestVibrationLevel: 64, latestAcousticLevel: 38, latestTemperature: 19.5, latestHumidity: 62, latestBattery: 78, latestSignalStrength: -61, latestActivityLevel: 'High Activity', lastUpdate: now, isOnline: true, firmwareVersion: '2.1.4', installationDate: '2025-11-15T00:00:00.000Z', assignedTeam: 'Technical Sensor Maintenance Team', notes: 'Installed on old cast-iron section. Baseline calibrated 2025-11-20.' },
  { deviceId: 'NERVE-NAR-002', name: 'Beta-2 Nerve Node', locationName: 'Pipe joint near road crossing, Narimanov', latitude: 40.4162, longitude: 49.8601, installationType: 'Pipe joint', currentStatus: 'SAFE', currentMode: 'Normal Mode', latestRiskScore: 18, latestVibrationLevel: 14, latestAcousticLevel: 12, latestTemperature: 21.0, latestHumidity: 54, latestBattery: 91, latestSignalStrength: -52, latestActivityLevel: 'Low Activity', lastUpdate: now, isOnline: true, firmwareVersion: '2.1.4', installationDate: '2025-11-20T00:00:00.000Z', assignedTeam: 'Technical Sensor Maintenance Team', notes: 'Stable readings. Joint was replaced 2024.' },
  { deviceId: 'NERVE-NAR-003', name: 'Gamma-3 Nerve Node', locationName: 'Utility zone near residential block, Narimanov', latitude: 40.4140, longitude: 49.8570, installationType: 'Utility zone', currentStatus: 'CRITICAL', currentMode: 'Mechanical + Acoustic Anomaly Mode', latestRiskScore: 84, latestVibrationLevel: 82, latestAcousticLevel: 76, latestTemperature: 20.1, latestHumidity: 67, latestBattery: 72, latestSignalStrength: -65, latestActivityLevel: 'Abnormal Activity', lastUpdate: now, isOnline: true, firmwareVersion: '2.1.3', installationDate: '2025-10-08T00:00:00.000Z', assignedTeam: 'Technical Sensor Maintenance Team', notes: 'Critical readings since May 28. Inspection dispatched.' },
  { deviceId: 'NERVE-NAR-004', name: 'Delta-4 Nerve Node', locationName: 'Repaired pipe line, near Narimanov park', latitude: 40.4170, longitude: 49.8615, installationType: 'Repaired utility line', currentStatus: 'WARNING', currentMode: 'Humidity Risk Mode', latestRiskScore: 47, latestVibrationLevel: 28, latestAcousticLevel: 22, latestTemperature: 17.8, latestHumidity: 79, latestBattery: 65, latestSignalStrength: -68, latestActivityLevel: 'Medium Activity', lastUpdate: now, isOnline: true, firmwareVersion: '2.1.4', installationDate: '2025-12-01T00:00:00.000Z', assignedTeam: 'Technical Sensor Maintenance Team', notes: 'Humidity elevated after recent rain.' },
  { deviceId: 'NERVE-NAR-005', name: 'Epsilon-5 Nerve Node', locationName: 'Road-under-pipe section, Hasan Aliyev St', latitude: 40.4148, longitude: 49.8595, installationType: 'Road-under-pipe', currentStatus: 'SAFE', currentMode: 'Normal Mode', latestRiskScore: 22, latestVibrationLevel: 19, latestAcousticLevel: 16, latestTemperature: 20.5, latestHumidity: 57, latestBattery: 88, latestSignalStrength: -55, latestActivityLevel: 'Low Activity', lastUpdate: now, isOnline: true, firmwareVersion: '2.1.4', installationDate: '2025-12-10T00:00:00.000Z', assignedTeam: 'Technical Sensor Maintenance Team', notes: 'Normal road traffic vibration within baseline. No anomaly.' },
  { deviceId: 'NERVE-NAR-006', name: 'Zeta-6 Nerve Node', locationName: 'Flood-prone area, Narimanov low zone', latitude: 40.4133, longitude: 49.8558, installationType: 'Flood-prone area', currentStatus: 'WARNING', currentMode: 'Humidity Risk Mode', latestRiskScore: 51, latestVibrationLevel: 31, latestAcousticLevel: 29, latestTemperature: 16.5, latestHumidity: 87, latestBattery: 54, latestSignalStrength: -72, latestActivityLevel: 'Medium Activity', lastUpdate: now, isOnline: true, firmwareVersion: '2.1.2', installationDate: '2025-09-18T00:00:00.000Z', assignedTeam: 'Technical Sensor Maintenance Team', notes: 'Low-lying zone. Humidity consistently high after rainfall. Battery needs replacement.' },
];
db.get('devices').push(...(devices as any[])).write();

// ─── Historical sensor readings (48 per device for charts) ───────────────────
const readings: any[] = [];
for (const device of devices) {
  for (let i = 47; i >= 0; i--) {
    const ts = new Date(Date.now() - i * 30 * 60 * 1000).toISOString();
    const noise = () => (Math.random() - 0.5) * 12;
    const vib = Math.max(5, Math.min(100, device.latestVibrationLevel + noise()));
    const ac = Math.max(5, Math.min(100, device.latestAcousticLevel + noise()));
    const temp = +(device.latestTemperature + (Math.random() - 0.5) * 2).toFixed(1);
    const hum = +(device.latestHumidity + (Math.random() - 0.5) * 5).toFixed(1);
    const bat = +Math.max(5, device.latestBattery - (47 - i) * 0.05).toFixed(1);
    const sig = device.latestSignalStrength + Math.round((Math.random() - 0.5) * 8);
    const rs = Math.max(0, Math.min(100, Math.round(device.latestRiskScore + (Math.random() - 0.5) * 15)));
    readings.push({
      readingId: uuidv4(), deviceId: device.deviceId,
      accelX: +((Math.random() * 0.4) - 0.2).toFixed(4),
      accelY: +((Math.random() * 0.2) - 0.1).toFixed(4),
      accelZ: +(9.78 + Math.random() * 0.06).toFixed(4),
      rawVibration: +(vib * 0.001).toFixed(4),
      vibrationLevel: +vib.toFixed(1), baseline: 0.0215,
      acousticLevel: +ac.toFixed(1), micPeakToPeak: Math.round(ac * 35),
      soundStatus: ac > 75 ? 'HIGH SOUND' : ac > 45 ? 'NORMAL SOUND' : 'QUIET',
      temperature: temp, humidity: hum, battery: bat, signalStrength: sig,
      source: 'simulation', uptimeMs: (47 - i) * 30 * 60 * 1000,
      timestamp: ts, calculatedRiskScore: rs,
      calculatedStatus: rs < 40 ? 'SAFE' : rs < 70 ? 'WARNING' : 'CRITICAL',
      calculatedMode: device.currentMode,
      activityLevel: rs <= 30 ? 'Low Activity' : rs <= 60 ? 'Medium Activity' : rs <= 80 ? 'High Activity' : 'Abnormal Activity',
      explanation: 'Seeded historical reading.',
      recommendedAction: 'Continue routine monitoring.',
    });
  }
}
db.get('sensorReadings').push(...readings).write();

// ─── Alerts ───────────────────────────────────────────────────────────────────
db.get('alerts').push(
  { alertId: uuidv4(), deviceId: 'NERVE-NAR-003', alertType: 'Combined Mechanical-Acoustic Anomaly', severity: 'CRITICAL', message: 'Critical vibration (82) and acoustic (76) anomaly on NERVE-NAR-003.', riskScore: 84, status: 'CRITICAL', mode: 'Mechanical + Acoustic Anomaly Mode', timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(), resolved: false, resolvedAt: null },
  { alertId: uuidv4(), deviceId: 'NERVE-NAR-001', alertType: 'Mechanical Anomaly', severity: 'HIGH', message: 'Vibration exceeded warning threshold on NERVE-NAR-001.', riskScore: 58, status: 'WARNING', mode: 'Mechanical Anomaly Mode', timestamp: new Date(Date.now() - 42 * 60 * 1000).toISOString(), resolved: false, resolvedAt: null },
  { alertId: uuidv4(), deviceId: 'NERVE-NAR-006', alertType: 'Humidity Risk', severity: 'HIGH', message: 'High humidity detected in flood-prone area sensor enclosure.', riskScore: 51, status: 'WARNING', mode: 'Humidity Risk Mode', timestamp: new Date(Date.now() - 90 * 60 * 1000).toISOString(), resolved: false, resolvedAt: null },
  { alertId: uuidv4(), deviceId: 'NERVE-NAR-004', alertType: 'Humidity Risk', severity: 'MEDIUM', message: 'Elevated humidity detected near repaired pipe joint.', riskScore: 47, status: 'WARNING', mode: 'Humidity Risk Mode', timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), resolved: false, resolvedAt: null },
  { alertId: uuidv4(), deviceId: 'NERVE-NAR-002', alertType: 'Mechanical Anomaly', severity: 'LOW', message: 'Minor vibration spike on NERVE-NAR-002. Returned to normal.', riskScore: 38, status: 'SAFE', mode: 'Normal Mode', timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), resolved: true, resolvedAt: new Date(Date.now() - 5.5 * 60 * 60 * 1000).toISOString() }
).write();

// ─── Issues ───────────────────────────────────────────────────────────────────
db.get('issues').push(
  { issueId: uuidv4(), source: 'sensor', linkedDeviceId: 'NERVE-NAR-003', category: 'Mechanical + Acoustic Anomaly Mode', title: 'Critical Combined Anomaly — Gamma-3 Utility Zone', description: 'NERVE-NAR-003 reported critical vibration (82) and acoustic (76) simultaneously. Immediate inspection required.', locationName: 'Utility zone near residential block, Narimanov', latitude: 40.4140, longitude: 49.8570, priority: 'CRITICAL', status: 'In Progress', assignedDepartment: 'Emergency Response Team', assignedPerson: 'Kamran Huseynov', deadline: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(), createdAt: new Date(Date.now() - 20 * 60 * 1000).toISOString(), updatedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(), notes: ['[Field team en route as of 23:50]'], auditLog: [{ action: 'Issue Created', by: 'System — Risk Engine', timestamp: new Date(Date.now() - 20 * 60 * 1000).toISOString(), detail: 'Auto-created. Risk Score: 84.' }, { action: 'Assigned', by: 'Admin', timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(), detail: 'Assigned to Emergency Response Team — Kamran Huseynov' }, { action: 'Status Changed', by: 'Kamran Huseynov', timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(), detail: 'Status changed to In Progress' }] },
  { issueId: uuidv4(), source: 'sensor', linkedDeviceId: 'NERVE-NAR-001', category: 'Mechanical Anomaly Mode', title: 'Elevated Vibration — Alpha-1 Old Pipe Section', description: 'Vibration level on old cast-iron pipe exceeded warning threshold. Possible mechanical degradation.', locationName: 'Old pipe section near Narimanov Ave', latitude: 40.4155, longitude: 49.8582, priority: 'HIGH', status: 'Assigned', assignedDepartment: 'Water and Sewage Utility', assignedPerson: 'Elmar Mammadov', deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(), updatedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(), notes: [], auditLog: [{ action: 'Issue Created', by: 'System — Risk Engine', timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(), detail: 'Auto-created. Risk Score: 58.' }, { action: 'Assigned', by: 'Admin', timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(), detail: 'Assigned to Water and Sewage Utility — Elmar Mammadov' }] },
  { issueId: uuidv4(), source: 'citizen', linkedDeviceId: null, category: 'Flooding / Subasma', title: 'Citizen Report: Flooding on Hasan Aliyev St', description: 'Citizen reported significant water flooding on street surface. Possible pipe burst.', locationName: 'Hasan Aliyev St, Narimanov', latitude: 40.4151, longitude: 49.8588, priority: 'HIGH', status: 'Under Review', assignedDepartment: '', assignedPerson: '', deadline: null, createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), updatedAt: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString(), notes: [], auditLog: [{ action: 'Issue Created', by: 'Citizen Report System', timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), detail: 'Created from citizen report.' }] }
).write();

// ─── Citizen reports ──────────────────────────────────────────────────────────
const reportData = [
  { category: 'Flooding / Subasma', desc: 'Significant water flooding at street surface intersection. Water level approx 15cm.', lat: 40.4151, lng: 49.8588, urgency: 'HIGH' },
  { category: 'Visible water leakage reported by citizen', desc: 'Water leaking from ground near pavement edge. Stains on asphalt visible for 2 days.', lat: 40.4160, lng: 49.8598, urgency: 'MEDIUM' },
  { category: 'Sewer/manhole problem', desc: 'Manhole cover broken and missing. Safety hazard at night. Smell of sewage.', lat: 40.4143, lng: 49.8572, urgency: 'HIGH' },
  { category: 'Road/asphalt damage', desc: 'Large pothole appeared after recent waterworks. Causing traffic hazard.', lat: 40.4168, lng: 49.8610, urgency: 'MEDIUM' },
  { category: 'Utility repair not completed', desc: 'Pipe repair crew left site without completing backfill. Road open for 3 days.', lat: 40.4136, lng: 49.8563, urgency: 'MEDIUM' },
  { category: 'Street lighting issue', desc: 'Three consecutive street lights not working on main avenue.', lat: 40.4175, lng: 49.8625, urgency: 'LOW' },
  { category: 'Cleanliness issue', desc: 'Garbage accumulation near construction site. Not collected for 5 days.', lat: 40.4128, lng: 49.8550, urgency: 'LOW' },
  { category: 'Tree/weather damage', desc: 'Large tree fell due to last night storm. Blocking pedestrian path.', lat: 40.4180, lng: 49.8640, urgency: 'MEDIUM' },
  { category: 'Road/asphalt damage', desc: 'Road sinking/depression near utility pipe area. Getting worse each week.', lat: 40.4145, lng: 49.8578, urgency: 'HIGH' },
  { category: 'Other', desc: 'Suspicious water pooling in basement of residential building. Origin unknown.', lat: 40.4158, lng: 49.8604, urgency: 'MEDIUM' },
];
const statuses = ['Submitted', 'Under Review', 'In Progress', 'Resolved'];
db.get('citizenReports').push(...(reportData.map((r, i) => ({
  reportId: uuidv4(),
  trackingCode: 'NRV-' + Math.random().toString(36).substr(2, 8).toUpperCase(),
  category: r.category, description: r.desc,
  photoUrl: null, latitude: r.lat, longitude: r.lng,
  address: `Narimanov District, Baku (Report #${i + 1})`,
  urgency: r.urgency, status: statuses[i % statuses.length],
  createdAt: new Date(Date.now() - (i + 1) * 3 * 60 * 60 * 1000).toISOString(),
  updatedAt: new Date(Date.now() - i * 60 * 60 * 1000).toISOString(),
})) as any[])).write();

console.log('✅ Nerve database seeded successfully!');
console.log(`   📟 Devices: ${db.get('devices').value().length}`);
console.log(`   📊 Sensor readings: ${db.get('sensorReadings').value().length}`);
console.log(`   🚨 Alerts: ${db.get('alerts').value().length}`);
console.log(`   🔧 Issues: ${db.get('issues').value().length}`);
console.log(`   📝 Citizen reports: ${db.get('citizenReports').value().length}`);
console.log(`   🏢 Departments: ${db.get('departments').value().length}`);
