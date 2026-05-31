import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Thermometer, Droplets, Activity, Volume2, Battery, Wifi,
  TrendingUp, Zap, AlertTriangle, CheckCircle, Clock,
} from 'lucide-react';
import { useNerveStore } from '../../store/useNerveStore';

interface SensorCardProps {
  label: string;
  value: string | number;
  unit?: string;
  icon: React.ReactNode;
  color: string;
  glow?: string;
  flash?: boolean;
}

function SensorCard({ label, value, unit, icon, color, glow, flash }: SensorCardProps) {
  const [flashing, setFlashing] = useState(false);
  const prevValue = useRef(value);

  useEffect(() => {
    if (flash && value !== prevValue.current) {
      prevValue.current = value;
      setFlashing(true);
      setTimeout(() => setFlashing(false), 600);
    }
  }, [value, flash]);

  return (
    <motion.div
      className={`glass-card p-3 relative overflow-hidden transition-all duration-300 ${flashing ? 'value-flash' : ''}`}
      style={{ borderColor: flashing ? color : undefined }}
      whileHover={{ y: -2, boxShadow: `0 8px 24px rgba(0,0,0,0.4), 0 0 0 1px ${color}33` }}
    >
      <div className="flex items-center gap-2 mb-2">
        <div className="p-1.5 rounded-lg" style={{ background: `${color}20` }}>
          <span style={{ color }}>{icon}</span>
        </div>
        <span className="text-[10px] text-nerve-dim uppercase tracking-wider font-medium">{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <motion.span
          key={String(value)}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xl font-bold text-nerve-text font-mono"
        >
          {value}
        </motion.span>
        {unit && <span className="text-xs text-nerve-dim">{unit}</span>}
      </div>
    </motion.div>
  );
}

export default function LiveSensorStream() {
  const { liveReading, devices, selectedDeviceId } = useNerveStore();

  // Use selected device's latest data or most critical device
  const device = selectedDeviceId
    ? devices.find((d) => d.deviceId === selectedDeviceId)
    : devices.sort((a, b) => b.latestRiskScore - a.latestRiskScore)[0];

  const r = liveReading?.deviceId === device?.deviceId ? liveReading : device;

  if (!device) return null;

  const statusColor = device.currentStatus === 'CRITICAL' ? '#e5193a'
    : device.currentStatus === 'WARNING' ? '#eab308' : '#22c55e';

  return (
    <div className="glass-card p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-nerve-red animate-pulse" />
          <span className="text-xs font-semibold text-nerve-text uppercase tracking-wider">Live Sensor Stream</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-nerve-dim">{device.deviceId}</span>
          <span className="text-[11px] px-2 py-0.5 rounded-full font-bold" style={{ color: statusColor, background: `${statusColor}15`, border: `1px solid ${statusColor}40` }}>
            {device.currentStatus}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
        <SensorCard label="Vibration" value={r?.latestVibrationLevel ?? device.latestVibrationLevel} unit="%" icon={<Activity size={13} />} color="#f97316" flash />
        <SensorCard label="Acoustic" value={r?.latestAcousticLevel ?? device.latestAcousticLevel} unit="dB" icon={<Volume2 size={13} />} color="#3b82f6" flash />
        <SensorCard label="Temperature" value={r?.latestTemperature ?? device.latestTemperature} unit="°C" icon={<Thermometer size={13} />} color="#22c55e" flash />
        <SensorCard label="Humidity" value={r?.latestHumidity ?? device.latestHumidity} unit="%" icon={<Droplets size={13} />} color="#06b6d4" flash />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
        <SensorCard label="Battery" value={r?.latestBattery ?? device.latestBattery} unit="%" icon={<Battery size={13} />} color={device.latestBattery < 20 ? '#e5193a' : '#22c55e'} flash />
        <SensorCard label="Signal" value={r?.latestSignalStrength ?? device.latestSignalStrength} unit="dBm" icon={<Wifi size={13} />} color="#8b5cf6" flash />
        <SensorCard label="Risk Score" value={r?.latestRiskScore ?? device.latestRiskScore} icon={<AlertTriangle size={13} />} color={statusColor} flash />
        <SensorCard label="Activity" value={(r?.latestActivityLevel ?? device.latestActivityLevel)?.split(' ')[0] ?? '—'} icon={<TrendingUp size={13} />} color="#eab308" flash />
      </div>

      {/* Mode + Last update */}
      <div className="flex items-center justify-between pt-2 border-t border-nerve-border">
        <div className="flex items-center gap-2">
          <Zap size={11} className="text-nerve-red" />
          <span className="text-[11px] text-nerve-muted">{device.currentMode}</span>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-nerve-dim">
          <Clock size={10} />
          {new Date(device.lastUpdate).toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
}
