import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, AlertTriangle, Thermometer, Droplets, Battery, Volume2, X } from 'lucide-react';
import { useNerveStore } from '../store/useNerveStore';
import { getDashboardSummary, getDevices, getDeviceReadings } from '../services/api';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, AreaChart, Area,
  PieChart, Pie, Cell, Sector, Legend,
} from 'recharts';

const statusColor = (s: string) => s === 'CRITICAL' ? '#e5193a' : s === 'WARNING' ? '#eab308' : '#22c55e';
const statusBg = (s: string) =>
  s === 'CRITICAL' ? 'bg-nerve-red/10 border-nerve-red/30' :
  s === 'WARNING'  ? 'bg-nerve-yellow/10 border-nerve-yellow/30' :
                     'bg-nerve-green/10 border-nerve-green/30';

const PIE_COLORS: Record<string, string> = {
  SAFE:     '#22c55e',
  WARNING:  '#eab308',
  CRITICAL: '#e5193a',
  OFFLINE:  '#6b7280',
};

/* ─── Summary card ─────────────────────────────────────────────────────────── */
function SummaryCard({ label, value, icon: Icon, color, suffix }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-4 flex items-center gap-3 glass-card-hover"
    >
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: `${color}15`, border: `1px solid ${color}30` }}
      >
        <Icon size={20} style={{ color }} />
      </div>
      <div className="min-w-0">
        <p className="text-[13px] text-nerve-dim uppercase tracking-wider font-semibold">{label}</p>
        <p className="text-2xl font-bold text-nerve-text truncate leading-tight">
          {value}
          {suffix && <span className="text-base text-nerve-dim ml-1">{suffix}</span>}
        </p>
      </div>
    </motion.div>
  );
}

/* ─── Live sensor row ──────────────────────────────────────────────────────── */
function LiveSensorValue({ label, value, unit, mono }: { label: string; value: any; unit?: string; mono?: boolean }) {
  return (
    <div className="flex justify-between items-center py-[5px] border-b border-nerve-border/20 last:border-0">
      <span className="text-[13px] text-nerve-dim">{label}</span>
      <span className={`text-[14px] font-semibold text-nerve-text ${mono ? 'font-mono' : ''}`}>
        {value}
        {unit && <span className="text-nerve-dim ml-0.5 text-[12px]">{unit}</span>}
      </span>
    </div>
  );
}

/* ─── Mini Gauge: SVG arc for risk score ─────────────────────────────────── */
function RiskArc({ score, color }: { score: number; color: string }) {
  const r = 38;
  const cx = 56;
  const cy = 52;
  const startAngle = -210;
  const sweep = 240;
  const clamp = Math.min(100, Math.max(0, score));
  const filled = (clamp / 100) * sweep;

  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const arcPath = (start: number, end: number, radius: number) => {
    const s = { x: cx + radius * Math.cos(toRad(start)), y: cy + radius * Math.sin(toRad(start)) };
    const e = { x: cx + radius * Math.cos(toRad(end)),   y: cy + radius * Math.sin(toRad(end)) };
    const large = end - start > 180 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${radius} ${radius} 0 ${large} 1 ${e.x} ${e.y}`;
  };

  return (
    <svg width={112} height={68} viewBox="0 0 112 68">
      {/* track */}
      <path d={arcPath(startAngle, startAngle + sweep, r)} fill="none" stroke="var(--color-border)" strokeWidth={7} strokeLinecap="round" />
      {/* fill */}
      {score > 0 && (
        <path d={arcPath(startAngle, startAngle + filled, r)} fill="none" stroke={color} strokeWidth={7} strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 4px ${color}80)` }} />
      )}
      <text x={cx} y={cy - 4} textAnchor="middle" fill={color} style={{ fontSize: 18, fontWeight: 700, fontFamily: 'JetBrains Mono,monospace' }}>{score}</text>
      <text x={cx} y={cy + 12} textAnchor="middle" fill="var(--color-dim)" style={{ fontSize: 9 }}>RISK</text>
    </svg>
  );
}

/* ─── Mini horizontal bar ────────────────────────────────────────────────── */
function MiniBar({ label, value, max, color, unit }: { label: string; value: number; max: number; color: string; unit?: string }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div>
      <div className="flex justify-between mb-0.5">
        <span className="text-[10px] text-nerve-dim">{label}</span>
        <span className="text-[11px] font-mono font-semibold text-nerve-text">{value}{unit}</span>
      </div>
      <div className="h-1.5 rounded-full bg-nerve-border overflow-hidden">
        <motion.div
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="h-full rounded-full"
          style={{ background: color, boxShadow: `0 0 6px ${color}60` }}
        />
      </div>
    </div>
  );
}

/* ─── Chart tooltip style ─────────────────────────────────────────────────── */
const tooltipStyle = {
  background: 'var(--color-card)',
  border: '1px solid var(--color-border)',
  borderRadius: 10,
  fontSize: 12,
};

/* ─── Active Pie Slice (animated expand on hover) ─────────────────────────── */
const renderActiveShape = (props: any) => {
  const {
    cx, cy, innerRadius, outerRadius, startAngle, endAngle,
    fill, payload, percent, value,
  } = props;
  return (
    <g>
      {/* centre label */}
      <text x={cx} y={cy - 10} textAnchor="middle" fill={fill} style={{ fontSize: 22, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace' }}>
        {value}
      </text>
      <text x={cx} y={cy + 14} textAnchor="middle" fill={fill} style={{ fontSize: 12, fontWeight: 600 }}>
        {payload.name}
      </text>
      <text x={cx} y={cy + 32} textAnchor="middle" fill="var(--color-dim)" style={{ fontSize: 11 }}>
        {(percent * 100).toFixed(0)}% of fleet
      </text>
      {/* expanded outer slice */}
      <Sector
        cx={cx} cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 10}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      {/* subtle ring */}
      <Sector
        cx={cx} cy={cy}
        innerRadius={outerRadius + 14}
        outerRadius={outerRadius + 18}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        opacity={0.4}
      />
    </g>
  );
};

/* ─── Dashboard Page ──────────────────────────────────────────────────────── */
export default function DashboardPage() {
  const { summary, liveReading, devices, alerts } = useNerveStore();
  const [chartData, setChartData] = useState<any[]>([]);
  const [activeSlice, setActiveSlice] = useState<number | undefined>(undefined);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const latestDevice = devices.find(d => d.deviceId === (liveReading?.deviceId || 'NERVE-NAR-001'));

  useEffect(() => {
    getDashboardSummary().then(s => useNerveStore.getState().setSummary(s)).catch(console.error);
    getDevices().then(d => useNerveStore.getState().setDevices(d)).catch(console.error);
    getDeviceReadings('NERVE-NAR-001', 50).then(readings => {
      setChartData(readings.map((r: any) => ({
        time: new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        vibration: r.vibrationLevel,
        acoustic: r.acousticLevel,
        risk: r.calculatedRiskScore,
        temp: r.temperature,
        humidity: r.humidity,
      })));
    }).catch(console.error);
  }, []);

  const lr = liveReading || latestDevice || {};

  /* ── Build pie data from live device list ── */
  const pieData = React.useMemo(() => {
    const counts: Record<string, number> = { SAFE: 0, WARNING: 0, CRITICAL: 0, OFFLINE: 0 };
    devices.forEach(d => {
      if (!d.isOnline) counts.OFFLINE++;
      else if (d.currentStatus === 'CRITICAL') counts.CRITICAL++;
      else if (d.currentStatus === 'WARNING')  counts.WARNING++;
      else counts.SAFE++;
    });
    return Object.entries(counts)
      .filter(([, v]) => v > 0)
      .map(([name, value]) => ({ name, value }));
  }, [devices]);

  const onPieClick = useCallback((_: any, index: number) => {
    const clicked = pieData[index]?.name ?? null;
    setFilterStatus(prev => (prev === clicked ? null : clicked));
    setActiveSlice(prev => (prev === index ? undefined : index));
  }, [pieData]);

  const onPieEnter = useCallback((_: any, index: number) => {
    setActiveSlice(index);
  }, []);

  /* ── Filtered device table ── */
  const filteredDevices = filterStatus
    ? devices.filter(d => {
        if (filterStatus === 'OFFLINE') return !d.isOnline;
        if (filterStatus === 'CRITICAL') return d.isOnline && d.currentStatus === 'CRITICAL';
        if (filterStatus === 'WARNING')  return d.isOnline && d.currentStatus === 'WARNING';
        return d.isOnline && d.currentStatus !== 'CRITICAL' && d.currentStatus !== 'WARNING';
      })
    : devices;

  return (
    <div className="page-content">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-nerve-text tracking-tight">Command Center Dashboard</h1>
        <p className="text-sm text-nerve-muted mt-1">
          AI-assisted non-invasive pipe monitoring · Real-time sensor fusion
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 mb-6">
        <SummaryCard label="Network Health" value={summary?.networkHealthPct ?? '—'} suffix="%" icon={Activity}      color="#22c55e" />
        <SummaryCard label="Critical"        value={summary?.critical ?? 0}             icon={AlertTriangle} color="#e5193a" />
        <SummaryCard label="Warning"         value={summary?.warning  ?? 0}             icon={AlertTriangle} color="#eab308" />
        <SummaryCard label="Avg Vibration"   value={summary?.avgVibration ?? '—'}       icon={Activity}      color="#f97316" />
        <SummaryCard label="Avg Acoustic"    value={summary?.avgAcousticLevel ?? '—'}   icon={Volume2}       color="#3b82f6" />
        <SummaryCard label="Avg Temp"        value={summary?.avgTemperature ?? '—'}  suffix="°C" icon={Thermometer} color="#06b6d4" />
        <SummaryCard label="Avg Humidity"    value={summary?.avgHumidity ?? '—'}     suffix="%"  icon={Droplets}   color="#8b5cf6" />
        <SummaryCard label="Avg Battery"     value={summary?.avgBattery ?? '—'}      suffix="%"  icon={Battery}    color="#22c55e" />
      </div>

      {/* Body: charts left, live stream + alerts right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* ── Left col ─────────────────────────────────────────────────────── */}
        <div className="lg:col-span-2 flex flex-col gap-4">

          {/* Vibration & Acoustic chart */}
          <div className="glass-card p-5">
            <h3 className="text-base font-semibold text-nerve-text mb-4">Vibration &amp; Acoustic Level Over Time</h3>
            <div className="h-56">
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

          {/* Risk + Temp/Humidity side by side */}
          <div className="grid grid-cols-2 gap-4">
            <div className="glass-card p-5">
              <h3 className="text-sm font-semibold text-nerve-text mb-3">Risk Score Trend</h3>
              <div className="h-40">
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
              <div className="h-40">
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
          </div>

          {/* ══════════════════════════════════════════════════════════════════
              INTERACTIVE PIE CHART — Device Status Distribution
              Click a slice to filter the table below
          ══════════════════════════════════════════════════════════════════ */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="glass-card p-5"
          >
            <div className="flex items-center justify-between mb-1">
              <div>
                <h3 className="text-base font-semibold text-nerve-text">Device Status Distribution</h3>
                <p className="text-xs text-nerve-dim mt-0.5">Click a slice to filter the device table below</p>
              </div>
              {/* Clear filter badge */}
              <AnimatePresence>
                {filterStatus && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.85 }}
                    onClick={() => { setFilterStatus(null); setActiveSlice(undefined); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all hover:opacity-80"
                    style={{
                      color: PIE_COLORS[filterStatus] ?? '#e2e8f0',
                      borderColor: (PIE_COLORS[filterStatus] ?? '#e2e8f0') + '50',
                      background:  (PIE_COLORS[filterStatus] ?? '#e2e8f0') + '12',
                    }}
                  >
                    <span>Showing: {filterStatus}</span>
                    <X size={12} />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>

            <div className="flex items-center gap-6">
              {/* Donut chart */}
              <div className="w-64 h-64 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      activeIndex={activeSlice}
                      activeShape={renderActiveShape}
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={68}
                      outerRadius={96}
                      dataKey="value"
                      onMouseEnter={onPieEnter}
                      onClick={onPieClick}
                      style={{ cursor: 'pointer' }}
                      animationBegin={0}
                      animationDuration={900}
                    >
                      {pieData.map((entry) => (
                        <Cell
                          key={entry.name}
                          fill={PIE_COLORS[entry.name] ?? '#6b7280'}
                          stroke="transparent"
                          opacity={filterStatus && filterStatus !== entry.name ? 0.3 : 1}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(value: any, name: any) => [`${value} device${value !== 1 ? 's' : ''}`, name]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Legend / stat cards */}
              <div className="flex-1 grid grid-cols-2 gap-3">
                {pieData.map((entry, i) => {
                  const color = PIE_COLORS[entry.name] ?? '#6b7280';
                  const isActive = filterStatus === entry.name;
                  const pct = devices.length > 0 ? Math.round((entry.value / devices.length) * 100) : 0;
                  return (
                    <motion.button
                      key={entry.name}
                      onClick={() => onPieClick(null, i)}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      className="p-4 rounded-xl text-left transition-all"
                      style={{
                        border: `1px solid ${color}${isActive ? '80' : '30'}`,
                        background: `${color}${isActive ? '18' : '0a'}`,
                        boxShadow: isActive ? `0 0 16px ${color}30` : 'none',
                      }}
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="w-3 h-3 rounded-full" style={{ background: color }} />
                        <span className="text-xs font-semibold text-nerve-muted uppercase tracking-wider">{entry.name}</span>
                      </div>
                      <p className="text-2xl font-bold font-mono" style={{ color }}>{entry.value}</p>
                      <p className="text-xs text-nerve-dim mt-0.5">{pct}% of fleet</p>
                      {/* mini bar */}
                      <div className="mt-2 h-1 rounded-full bg-nerve-border overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.8, delay: 0.2 }}
                          className="h-full rounded-full"
                          style={{ background: color }}
                        />
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </motion.div>

          {/* Device status table (filtered by pie selection) */}
          <div className="glass-card p-5 overflow-x-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-nerve-text">
                Device Status Overview
                {filterStatus && (
                  <span className="ml-2 text-base font-normal" style={{ color: PIE_COLORS[filterStatus] }}>
                    — {filterStatus} only ({filteredDevices.length})
                  </span>
                )}
              </h3>
              {filteredDevices.length !== devices.length && (
                <span className="text-sm text-nerve-dim">
                  {filteredDevices.length} / {devices.length} devices
                </span>
              )}
            </div>
            <table className="w-full">
              <thead>
                <tr className="text-nerve-dim text-left border-b border-nerve-border text-[13px] uppercase tracking-wider">
                  <th className="pb-2 font-semibold">Device</th>
                  <th className="pb-2 font-semibold">Status</th>
                  <th className="pb-2 font-semibold">Risk</th>
                  <th className="pb-2 font-semibold">Vibration</th>
                  <th className="pb-2 font-semibold">Acoustic</th>
                  <th className="pb-2 font-semibold">Temp</th>
                  <th className="pb-2 font-semibold">Battery</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence mode="popLayout">
                  {filteredDevices.map(d => (
                    <motion.tr
                      key={d.deviceId}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      layout
                      className="border-b border-nerve-border/30 hover:bg-nerve-card/50 transition-colors text-[13px]"
                    >
                      <td className="py-2.5 font-mono font-semibold text-nerve-text">{d.deviceId}</td>
                      <td className="py-2.5">
                        <span
                          className="px-2.5 py-0.5 rounded-full text-[11px] font-bold border"
                          style={{
                            color: statusColor(d.currentStatus),
                            borderColor: statusColor(d.currentStatus) + '40',
                            background: statusColor(d.currentStatus) + '10',
                          }}
                        >
                          {d.currentStatus}
                        </span>
                      </td>
                      <td className="py-2.5 font-mono font-bold" style={{ color: statusColor(d.currentStatus) }}>{d.latestRiskScore}</td>
                      <td className="py-2.5 font-mono">{d.latestVibrationLevel}</td>
                      <td className="py-2.5 font-mono">{d.latestAcousticLevel}</td>
                      <td className="py-2.5 font-mono">{d.latestTemperature}°C</td>
                      <td className="py-2.5 font-mono">{d.latestBattery}%</td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
                {filteredDevices.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-sm text-nerve-dim">
                      No devices match the selected filter
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Right col: live stream + alerts ──────────────────────────────── */}
        <div className="flex flex-col gap-4">

          {/* Live Sensor Stream */}
          <div className={`glass-card p-4 border ${statusBg(lr.calculatedStatus || lr.currentStatus || 'SAFE')}`}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-semibold text-nerve-text">Live Sensor Stream</h3>
              <span className="text-[11px] font-mono text-nerve-dim">{lr.deviceId || 'NERVE-NAR-001'}</span>
            </div>
            <div className="flex items-center gap-3 mb-3">
              <span className="text-3xl font-bold font-mono" style={{ color: statusColor(lr.calculatedStatus || lr.currentStatus || 'SAFE') }}>
                {lr.calculatedRiskScore ?? lr.latestRiskScore ?? '—'}
              </span>
              <div>
                <span className="text-sm font-bold block" style={{ color: statusColor(lr.calculatedStatus || lr.currentStatus || 'SAFE') }}>
                  {lr.calculatedStatus || lr.currentStatus || '—'}
                </span>
                <span className="text-[11px] text-nerve-dim leading-tight">{lr.calculatedMode || lr.currentMode || '—'}</span>
              </div>
            </div>
            <div className="bg-nerve-bg rounded-xl p-2.5">
              <LiveSensorValue label="accelX"         value={lr.accelX?.toFixed(4)            ?? '—'} unit="g"   mono />
              <LiveSensorValue label="accelY"         value={lr.accelY?.toFixed(4)            ?? '—'} unit="g"   mono />
              <LiveSensorValue label="accelZ"         value={lr.accelZ?.toFixed(4)            ?? '—'} unit="g"   mono />
              <LiveSensorValue label="rawVibration"   value={lr.rawVibration?.toFixed(4)      ?? '—'}            mono />
              <LiveSensorValue label="vibrationLevel" value={lr.vibrationLevel ?? lr.latestVibrationLevel ?? '—'}  mono />
              <LiveSensorValue label="baseline"       value={lr.baseline?.toFixed(4)          ?? '—'}            mono />
              <LiveSensorValue label="acousticLevel"  value={lr.acousticLevel ?? lr.latestAcousticLevel  ?? '—'}  mono />
              <LiveSensorValue label="micPeakToPeak"  value={lr.micPeakToPeak                 ?? '—'}            mono />
              <LiveSensorValue label="soundStatus"    value={lr.soundStatus                   ?? '—'} />
              <LiveSensorValue label="temperature"    value={lr.temperature ?? lr.latestTemperature ?? '—'} unit="°C" mono />
              <LiveSensorValue label="humidity"       value={lr.humidity    ?? lr.latestHumidity    ?? '—'} unit="%" mono />
              <LiveSensorValue label="battery"        value={lr.battery     ?? lr.latestBattery     ?? '—'} unit="%" mono />
              <LiveSensorValue label="signalStrength" value={lr.signalStrength ?? lr.latestSignalStrength ?? '—'} unit="dBm" mono />
              <LiveSensorValue label="activityLevel"  value={lr.activityLevel ?? lr.latestActivityLevel ?? '—'} />
              <LiveSensorValue label="source"         value={lr.source ?? '—'} />
            </div>

            {/* ── Live mini gauges ─────────────────────────────────────── */}
            <div className="mt-3 p-3 rounded-xl bg-nerve-bg border border-nerve-border/40">
              <p className="text-[10px] text-nerve-dim uppercase tracking-wider mb-2 font-semibold">Device Health Snapshot</p>
              <div className="flex items-center gap-3">
                {/* Risk arc */}
                <RiskArc
                  score={lr.calculatedRiskScore ?? lr.latestRiskScore ?? 0}
                  color={statusColor(lr.calculatedStatus || lr.currentStatus || 'SAFE')}
                />
                {/* Bars */}
                <div className="flex-1 flex flex-col gap-2">
                  <MiniBar
                    label="Battery"
                    value={lr.battery ?? lr.latestBattery ?? 0}
                    max={100}
                    color="#22c55e"
                    unit="%"
                  />
                  <MiniBar
                    label="Humidity"
                    value={lr.humidity ?? lr.latestHumidity ?? 0}
                    max={100}
                    color="#8b5cf6"
                    unit="%"
                  />
                  <MiniBar
                    label="Vibration"
                    value={Math.min(100, lr.vibrationLevel ?? lr.latestVibrationLevel ?? 0)}
                    max={100}
                    color="#f97316"
                  />
                  <MiniBar
                    label="Acoustic"
                    value={Math.min(100, lr.acousticLevel ?? lr.latestAcousticLevel ?? 0)}
                    max={100}
                    color="#3b82f6"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Recent Alerts */}
          <div className="glass-card p-4 flex-1">
            <h3 className="text-base font-semibold text-nerve-text mb-3">Recent Alerts</h3>
            <div className="flex flex-col gap-2 max-h-80 overflow-y-auto">
              {alerts.filter(a => !a.resolved).slice(0, 8).map(a => (
                <div key={a.alertId} className="p-3 rounded-xl bg-nerve-bg border border-nerve-border/50">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${a.severity === 'CRITICAL' ? 'bg-nerve-red animate-pulse-red' : 'bg-nerve-orange'}`} />
                    <span className="text-[13px] font-semibold text-nerve-text">{a.alertType}</span>
                    <span className="ml-auto text-[10px] text-nerve-dim font-mono">{a.deviceId}</span>
                  </div>
                  <p className="text-[11px] text-nerve-muted line-clamp-2">{a.message}</p>
                </div>
              ))}
              {alerts.filter(a => !a.resolved).length === 0 && (
                <p className="text-sm text-nerve-dim text-center py-6">All clear — no active alerts</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
