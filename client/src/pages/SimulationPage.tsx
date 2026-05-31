import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Zap, Thermometer, Droplets, Battery, Wifi, AlertTriangle, Activity, Volume2, StopCircle, Send } from 'lucide-react';
import { simulateReading, getDevices } from '../services/api';
import { useNerveStore } from '../store/useNerveStore';

const SCENARIOS = [
  { key: 'normal', label: 'Normal Data', icon: <Activity size={14} />, color: '#22c55e', desc: 'Low vibration and acoustic, all sensors nominal' },
  { key: 'light_vibration', label: 'Light Vibration', icon: <Activity size={14} />, color: '#eab308', desc: 'Mild vibration activity above baseline' },
  { key: 'high_vibration', label: 'High Vibration', icon: <Activity size={14} />, color: '#f97316', desc: 'Elevated vibration — warning level' },
  { key: 'critical_vibration', label: 'Critical Vibration', icon: <AlertTriangle size={14} />, color: '#e5193a', desc: 'Critical mechanical vibration anomaly' },
  { key: 'acoustic_anomaly', label: 'Acoustic Anomaly', icon: <Volume2 size={14} />, color: '#3b82f6', desc: 'High acoustic activity without vibration' },
  { key: 'mechanical_acoustic', label: 'Mech + Acoustic', icon: <AlertTriangle size={14} />, color: '#e5193a', desc: 'Combined high vibration AND acoustic — critical' },
  { key: 'freeze_warning', label: 'Freeze Warning', icon: <Thermometer size={14} />, color: '#06b6d4', desc: 'Temperature near 1.5°C — freeze risk warning' },
  { key: 'freeze_critical', label: 'Freeze Critical', icon: <Thermometer size={14} />, color: '#e5193a', desc: 'Sub-zero temperature — critical freeze risk' },
  { key: 'high_humidity', label: 'High Humidity', icon: <Droplets size={14} />, color: '#8b5cf6', desc: 'Humidity above 90% — high moisture risk' },
  { key: 'combined_critical', label: 'Combined Critical', icon: <AlertTriangle size={14} />, color: '#e5193a', desc: 'Max risk: all factors elevated simultaneously' },
  { key: 'low_battery', label: 'Low Battery', icon: <Battery size={14} />, color: '#f97316', desc: 'Battery below 10% — urgent maintenance needed' },
  { key: 'weak_signal', label: 'Weak Signal', icon: <Wifi size={14} />, color: '#eab308', desc: 'Wi-Fi RSSI below -80 dBm — reliability risk' },
];

export default function SimulationPage() {
  const { devices } = useNerveStore();
  const [selectedDevice, setSelectedDevice] = useState('NERVE-NAR-001');
  const [lastResult, setLastResult] = useState<any>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [liveMode, setLiveMode] = useState(false);
  const [liveInterval, setLiveInterval] = useState<any>(null);
  const [liveScenario, setLiveScenario] = useState('normal');
  const [liveCount, setLiveCount] = useState(0);

  useEffect(() => {
    if (devices.length === 0) getDevices().catch(console.error);
  }, []);

  const sendScenario = async (scenario: string) => {
    setLoading(scenario);
    try {
      const result = await simulateReading(selectedDevice, scenario);
      setLastResult({ scenario, ...result, time: new Date().toLocaleTimeString() });
    } catch (e: any) {
      setLastResult({ error: e.message });
    } finally {
      setLoading(null);
    }
  };

  const toggleLiveMode = () => {
    if (liveMode) {
      clearInterval(liveInterval);
      setLiveInterval(null);
      setLiveMode(false);
    } else {
      setLiveMode(true);
      setLiveCount(0);
      const interval = setInterval(async () => {
        await simulateReading(selectedDevice, liveScenario);
        setLiveCount((c) => c + 1);
      }, 1000);
      setLiveInterval(interval);
    }
  };

  useEffect(() => () => { if (liveInterval) clearInterval(liveInterval); }, [liveInterval]);

  const statusColor = lastResult?.status === 'CRITICAL' ? '#e5193a' : lastResult?.status === 'WARNING' ? '#eab308' : '#22c55e';

  return (
    <div className="page-content overflow-y-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-nerve-text">Simulation Panel</h1>
        <p className="text-sm text-nerve-muted mt-1">Send fake sensor readings through the same risk pipeline as real ESP32 data</p>
        <div className="mt-2 flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-nerve-yellow animate-pulse" />
          <span className="text-sm text-nerve-yellow font-semibold">Data source: Simulation</span>
          <span className="text-sm text-nerve-dim">· Same API endpoint as ESP32: POST /api/sensor-data</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Controls */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {/* Device selector */}
          <div className="glass-card p-5">
            <label className="text-xs font-semibold text-nerve-muted mb-2 block uppercase tracking-wider">Target Device</label>
            <select
              value={selectedDevice}
              onChange={(e) => setSelectedDevice(e.target.value)}
              className="w-full bg-nerve-card border border-nerve-border rounded-xl px-3 py-2.5 text-sm text-nerve-text focus:outline-none focus:border-nerve-red/50"
            >
              {(['NERVE-NAR-001','NERVE-NAR-002','NERVE-NAR-003','NERVE-NAR-004','NERVE-NAR-005','NERVE-NAR-006']).map((id) => (
                <option key={id} value={id}>{id}</option>
              ))}
            </select>
          </div>

          {/* Scenario buttons */}
          <div className="glass-card p-5">
            <p className="text-sm font-semibold text-nerve-muted mb-4 uppercase tracking-wider">Simulation Scenarios</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {SCENARIOS.map((s) => (
                <motion.button
                  key={s.key}
                  onClick={() => sendScenario(s.key)}
                  disabled={!!loading || liveMode}
                  className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden ${loading === s.key ? 'opacity-60' : 'hover:-translate-y-0.5'}`}
                  style={{ borderColor: `${s.color}40`, background: `${s.color}08` }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <span style={{ color: s.color }}>{s.icon}</span>
                    <span className="text-sm font-semibold text-nerve-text">{s.label}</span>
                  </div>
                  <p className="text-xs text-nerve-dim">{s.desc}</p>
                  {loading === s.key && (
                    <div className="absolute inset-0 flex items-center justify-center bg-nerve-bg/60">
                      <div className="w-4 h-4 border-2 border-nerve-red border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Live test mode */}
          <div className="glass-card p-5">
            <p className="text-sm font-semibold text-nerve-muted mb-3 uppercase tracking-wider">Live Test Mode</p>
            <div className="flex items-center gap-3 mb-3">
              <select
                value={liveScenario}
                onChange={(e) => setLiveScenario(e.target.value)}
                className="flex-1 bg-nerve-card border border-nerve-border rounded-xl px-3 py-2 text-sm text-nerve-text focus:outline-none focus:border-nerve-red/50"
                disabled={liveMode}
              >
                {SCENARIOS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
              </select>
              <motion.button
                onClick={toggleLiveMode}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all ${liveMode ? 'bg-nerve-red/20 border border-nerve-red/40 text-nerve-red' : 'bg-nerve-green/20 border border-nerve-green/30 text-nerve-green'}`}
                whileTap={{ scale: 0.97 }}
              >
                {liveMode ? <><StopCircle size={14} /> Stop</> : <><Play size={14} /> Start Live</>}
              </motion.button>
            </div>
            {liveMode && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 p-2 rounded-lg bg-nerve-green/10 border border-nerve-green/20">
                <div className="w-2 h-2 rounded-full bg-nerve-green animate-pulse" />
                <span className="text-xs text-nerve-green font-medium">Sending data every 1s</span>
                <span className="ml-auto text-xs text-nerve-dim font-mono">{liveCount} readings sent</span>
              </motion.div>
            )}
          </div>
        </div>

        {/* Result panel */}
        <div className="flex flex-col gap-4">
          <div className="glass-card p-5 flex-1">
            <p className="text-sm font-semibold text-nerve-muted mb-4 uppercase tracking-wider">Last Response</p>
            {!lastResult ? (
              <div className="flex flex-col items-center justify-center h-40 text-nerve-dim">
                <Send size={24} className="mb-2 opacity-30" />
                <p className="text-xs">Send a scenario to see results</p>
              </div>
            ) : lastResult.error ? (
              <div className="p-3 rounded-xl bg-nerve-red/10 border border-nerve-red/30">
                <p className="text-xs text-nerve-red">{lastResult.error}</p>
              </div>
            ) : (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-2">
                <div className="p-3 rounded-xl border" style={{ borderColor: `${statusColor}40`, background: `${statusColor}08` }}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-base font-bold font-mono" style={{ color: statusColor }}>{lastResult.status}</span>
                    <span className="text-sm text-nerve-dim">Risk: <span className="font-mono font-bold text-nerve-text">{lastResult.riskScore}</span></span>
                    <span className="ml-auto text-xs text-nerve-dim">{lastResult.time}</span>
                  </div>
                  <p className="text-sm text-nerve-muted">{lastResult.mode}</p>
                </div>
                <div className="p-3 rounded-xl bg-nerve-card border border-nerve-border">
                  <p className="text-[10px] text-nerve-dim mb-1 uppercase tracking-wider">Explanation</p>
                  <p className="text-xs text-nerve-text">{lastResult.explanation}</p>
                </div>
                <div className="p-3 rounded-xl bg-nerve-card border border-nerve-border">
                  <p className="text-[10px] text-nerve-dim mb-1 uppercase tracking-wider">Recommended Action</p>
                  <p className="text-xs text-nerve-text">{lastResult.recommendedAction}</p>
                </div>
                <div className="p-2 rounded-lg bg-nerve-card border border-nerve-border text-center">
                  <span className="text-[10px] text-nerve-dim">Activity: </span>
                  <span className="text-[11px] font-medium text-nerve-text">{lastResult.activityLevel}</span>
                </div>
              </motion.div>
            )}
          </div>

          {/* ESP32 info box */}
          <div className="glass-card p-5">
            <p className="text-sm font-semibold text-nerve-muted mb-3 uppercase tracking-wider">Real ESP32 Integration</p>
            <p className="text-sm text-nerve-dim mb-2">Point your ESP32 to:</p>
            <div className="p-3 rounded-xl bg-nerve-bg border border-nerve-border font-mono text-sm text-nerve-green mb-3">
              POST http://YOUR_IP:5000/api/sensor-data
            </div>
            <p className="text-xs text-nerve-dim">Use the same JSON structure as simulation. Set <span className="text-nerve-green font-mono">"source": "esp32"</span></p>
          </div>
        </div>
      </div>
    </div>
  );
}
