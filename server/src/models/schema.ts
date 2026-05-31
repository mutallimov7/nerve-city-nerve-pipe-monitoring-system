// Database schema types for Nerve platform
export interface Device {
  deviceId: string;
  name: string;
  locationName: string;
  latitude: number;
  longitude: number;
  installationType: string;
  currentStatus: 'SAFE' | 'WARNING' | 'CRITICAL' | 'OFFLINE';
  currentMode: string;
  latestRiskScore: number;
  latestVibrationLevel: number;
  latestAcousticLevel: number;
  latestTemperature: number;
  latestHumidity: number;
  latestBattery: number;
  latestSignalStrength: number;
  latestActivityLevel: string;
  lastUpdate: string;
  isOnline: boolean;
  firmwareVersion: string;
  installationDate: string;
  assignedTeam: string;
  notes: string;
}

export interface SensorReading {
  readingId: string;
  deviceId: string;
  accelX: number;
  accelY: number;
  accelZ: number;
  rawVibration: number;
  vibrationLevel: number;
  baseline: number;
  acousticLevel: number;
  micPeakToPeak: number;
  soundStatus: string;
  temperature: number;
  humidity: number;
  battery: number;
  signalStrength: number;
  source: 'simulation' | 'esp32';
  uptimeMs: number;
  timestamp: string;
  calculatedRiskScore: number;
  calculatedStatus: string;
  calculatedMode: string;
  activityLevel: string;
  explanation: string;
  recommendedAction: string;
}

export interface Alert {
  alertId: string;
  deviceId: string;
  alertType: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string;
  riskScore: number;
  status: string;
  mode: string;
  timestamp: string;
  resolved: boolean;
  resolvedAt: string | null;
}

export interface AuditLogEntry {
  action: string;
  by: string;
  timestamp: string;
  detail: string;
}

export interface Issue {
  issueId: string;
  source: 'sensor' | 'citizen' | 'admin';
  linkedDeviceId: string | null;
  category: string;
  title: string;
  description: string;
  locationName: string;
  latitude: number;
  longitude: number;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'New' | 'Under Review' | 'Assigned' | 'In Progress' | 'Resolved' | 'Rejected' | 'Archived';
  assignedDepartment: string;
  assignedPerson: string;
  deadline: string | null;
  createdAt: string;
  updatedAt: string;
  notes: string[];
  auditLog: AuditLogEntry[];
}

export interface CitizenReport {
  reportId: string;
  trackingCode: string;
  category: string;
  description: string;
  photoUrl: string | null;
  latitude: number | null;
  longitude: number | null;
  address: string;
  urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface Department {
  departmentId: string;
  name: string;
  description: string;
  contactEmail: string;
  contactPhone: string;
}

export interface Settings {
  demoMode: boolean;
  esp32Mode: boolean;
  vibrationCriticalThreshold: number;
  vibrationWarningThreshold: number;
  acousticCriticalThreshold: number;
  acousticWarningThreshold: number;
  temperatureFreezeCritical: number;
  temperatureFreezeWarning: number;
  humidityHighThreshold: number;
  humidityWarningThreshold: number;
  batteryLowThreshold: number;
  batteryWarningThreshold: number;
  signalWeakThreshold: number;
  notificationsEnabled: boolean;
}

export interface DatabaseSchema {
  devices: Device[];
  sensorReadings: SensorReading[];
  alerts: Alert[];
  issues: Issue[];
  citizenReports: CitizenReport[];
  departments: Department[];
  settings: Settings;
}
