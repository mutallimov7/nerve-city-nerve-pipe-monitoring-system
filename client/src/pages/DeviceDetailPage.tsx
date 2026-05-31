import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getDevice, getDeviceReadings } from '../services/api';
import { useNerveStore } from '../store/useNerveStore';
import { motion } from 'framer-motion';
import { ArrowLeft, Activity, Thermometer, Droplets, Battery, Wifi, Volume2, Gauge, Cpu, AlertTriangle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

const statusColor = (s: string) => s === 'CRITICAL' ? '#e5193a' : s === 'WARNING' ? '#eab308' : '#22c55e';
const tooltipStyle = { background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 10, fontSize: 12 };

function SensorCard({ label, value, unit, icon: Icon, color }: any) {
  return (
    <div className="glass-card p-3.5 flex items-center gap-3">
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: `${color}15`, border: `1px solid ${color}30` }}
      >
        <Icon size={17} style={{ color }} />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] text-nerve-dim uppercase tracking-wide font-medium">{label}</p>
        <p className="text-sm font-bold font-mono text-nerve-text truncate">
          {value}
          {unit && <span className="text-nerve-dim text-[11px] ml-1">{unit}</span>}
        </p>
      </div>
    </div>
  );
}

export default function DeviceDetailPage() {
  const { deviceId } = useParams();
  const navigate = useNavigate();
  const { liveReading } = useNerveStore();
  const [device, setDevice] = useState<any>(null);
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    if (!deviceId) return;
    getDevice(deviceId).then(setDevice).catch(console.error);
    getDeviceReadings(deviceId, 60).then(r => {
      setChartData(r.map((x: any) => ({
        time: new Date(x.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        vibration: x.vibrationLevel,
        acoustic: x.acousticLevel,
        risk: x.calculatedRiskScore,
        temp: x.temperature,
        humidity: x.humidity,
        accelX: x.accelX,
        accelY: x.accelY,
        accelZ: x.accelZ,
      })));
    }).catch(console.error);
  }, [deviceId]);

  const isLive = liveReading && liveReading.deviceId === deviceId;
  const lr = isLive ? liveReading : null;

  if (!device) {
    return (
      <div className="page-content flex items-center justify-center text-nerve-dim text-sm">
        Loading device...
      </div>
    );
  }

  const d = device;
  const status = lr?.calculatedStatus || d.currentStatus;
  const riskScore = lr?.calculatedRiskScore ?? d.latestRiskScore;

  return (
    <div className="page-content">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-xl bg-nerve-card border border-nerve-border flex items-center justify-center text-nerve-dim hover:text-nerve-text transition-colors"
        >
          <ArrowLeft size={17} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-nerve-text">{d.deviceId} — {d.name}</h1>
          <p className="text-sm text-nerve-muted">{d.locationName} · {d.installationType}</p>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <span className="text-4xl font-bold font-mono" style={{ color: statusColor(status) }}>{riskScore}</span>
          <div>
            <span className="text-base font-bold block" style={{ color: statusColor(status) }}>{status}</span>
            <span className="text-xs text-nerve-dim">{lr?.calculatedMode || d.currentMode}</span>
          </div>
        </div>
      </div>

      {/* Sensor values grid */}
      <div className="glass-card p-5 mb-5">
        <h3 className="text-sm font-semibold text-nerve-dim uppercase tracking-wider mb-4">Live Sensor Values</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          <SensorCard label="accelX"         value={(lr?.accelX ?? 0).toFixed(4)}                unit="g"   icon={Activity}      color="#f97316" />
          <SensorCard label="accelY"         value={(lr?.accelY ?? 0).toFixed(4)}                unit="g"   icon={Activity}      color="#f97316" />
          <SensorCard label="accelZ"         value={(lr?.accelZ ?? 9.81).toFixed(4)}             unit="g"   icon={Activity}      color="#f97316" />
          <SensorCard label="rawVibration"   value={(lr?.rawVibration ?? 0).toFixed(4)}                     icon={Activity}      color="#f97316" />
          <SensorCard label="vibrationLevel" value={lr?.vibrationLevel ?? d.latestVibrationLevel}           icon={Gauge}         color="#f97316" />
          <SensorCard label="baseline"       value={(lr?.baseline ?? 0.021).toFixed(4)}                     icon={Activity}      color="#64748b" />
          <SensorCard label="acousticLevel"  value={lr?.acousticLevel  ?? d.latestAcousticLevel}            icon={Volume2}       color="#3b82f6" />
          <SensorCard label="micPeakToPeak"  value={lr?.micPeakToPeak  ?? '—'}                              icon={Volume2}       color="#3b82f6" />
          <SensorCard label="soundStatus"    value={lr?.soundStatus    ?? '—'}                              icon={Volume2}       color="#3b82f6" />
          <SensorCard label="temperature"    value={lr?.temperature    ?? d.latestTemperature}  unit="°C"  icon={Thermometer}   color="#06b6d4" />
          <SensorCard label="humidity"       value={lr?.humidity       ?? d.latestHumidity}     unit="%"   icon={Droplets}      color="#8b5cf6" />
          <SensorCard label="battery"        value={lr?.battery        ?? d.latestBattery}      unit="%"   icon={Battery}       color="#22c55e" />
          <SensorCard label="signalStrength" value={lr?.signalStrength ?? d.latestSignalStrength} unit="dBm" icon={Wifi}        color="#22c55e" />
          <SensorCard label="riskScore"      value={riskScore}                                              icon={AlertTriangle} color={statusColor(status)} />
          <SensorCard label="activityLevel"  value={lr?.activityLevel  ?? d.latestActivityLevel}            icon={Activity}      color="#eab308" />
          <SensorCard label="source"         value={lr?.source         ?? 'seed'}                           icon={Cpu}           color="#64748b" />
        </div>
      </div>

      {/* Risk engine analysis */}
      {(lr?.explanation || lr?.recommendedAction) && (
        <div className="glass-card p-5 mb-5">
          <h3 className="text-sm font-semibold text-nerve-dim uppercase tracking-wider mb-2">Risk Engine Analysis</h3>
          <p className="text-sm text-nerve-text mb-2">{lr.explanation}</p>
          <p className="text-sm text-nerve-muted"><strong>Recommended:</strong> {lr.recommendedAction}</p>
        </div>
      )}

      {/* Charts 2×2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5">
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-nerve-text mb-3">Vibration &amp; Acoustic Over Time</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" stroke="var(--color-dim)" fontSize={11} tickLine={false} />
                <YAxis stroke="var(--color-dim)" fontSize={11} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="vibration" stroke="#f97316" fill="#f9731622" strokeWidth={2} name="Vibration" />
                <Area type="monotone" dataKey="acoustic"  stroke="#3b82f6" fill="#3b82f622" strokeWidth={2} name="Acoustic" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-nerve-text mb-3">Risk Score Trend</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" stroke="var(--color-dim)" fontSize={11} tickLine={false} />
                <YAxis stroke="var(--color-dim)" fontSize={11} tickLine={false} domain={[0, 100]} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="risk" stroke="#e5193a" strokeWidth={2} dot={false} name="Risk" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-nerve-text mb-3">Temperature &amp; Humidity</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" stroke="var(--color-dim)" fontSize={11} tickLine={false} />
                <YAxis stroke="var(--color-dim)" fontSize={11} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="temp"     stroke="#06b6d4" strokeWidth={2} dot={false} name="Temp °C" />
                <Line type="monotone" dataKey="humidity" stroke="#8b5cf6" strokeWidth={2} dot={false} name="Humidity %" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-nerve-text mb-3">Acceleration X / Y / Z</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" stroke="var(--color-dim)" fontSize={11} tickLine={false} />
                <YAxis stroke="var(--color-dim)" fontSize={11} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="accelX" stroke="#f97316" strokeWidth={1.5} dot={false} name="accelX" />
                <Line type="monotone" dataKey="accelY" stroke="#3b82f6" strokeWidth={1.5} dot={false} name="accelY" />
                <Line type="monotone" dataKey="accelZ" stroke="#22c55e" strokeWidth={1.5} dot={false} name="accelZ" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Device info */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold text-nerve-dim uppercase tracking-wider mb-4">Device Information</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div><span className="text-nerve-dim">Firmware:</span> <span className="text-nerve-text font-mono ml-1">{d.firmwareVersion}</span></div>
          <div><span className="text-nerve-dim">Installed:</span> <span className="text-nerve-text ml-1">{new Date(d.installationDate).toLocaleDateString()}</span></div>
          <div><span className="text-nerve-dim">Team:</span> <span className="text-nerve-text ml-1">{d.assignedTeam}</span></div>
          <div><span className="text-nerve-dim">Online:</span> <span className={`ml-1 font-semibold ${d.isOnline ? 'text-nerve-green' : 'text-nerve-red'}`}>{d.isOnline ? 'Yes' : 'No'}</span></div>
          <div className="col-span-2 md:col-span-4"><span className="text-nerve-dim">Notes:</span> <span className="text-nerve-text ml-1">{d.notes}</span></div>
          <div><span className="text-nerve-dim">Last Update:</span> <span className="text-nerve-text font-mono ml-1">{new Date(d.lastUpdate).toLocaleString()}</span></div>
          <div><span className="text-nerve-dim">Coordinates:</span> <span className="text-nerve-text font-mono ml-1">{d.latitude}, {d.longitude}</span></div>
        </div>
      </div>
    </div>
  );
}
