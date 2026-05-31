import React, { useEffect, useState } from 'react';
import { getSettings, updateSettings } from '../services/api';
import { motion } from 'framer-motion';
import { Save, Settings } from 'lucide-react';

export default function SettingsPage() {
  const [settings, setSettings] = useState<any>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => { getSettings().then(setSettings).catch(console.error); }, []);

  const handleSave = async () => {
    await updateSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (!settings) return <div className="page-content flex items-center justify-center"><div className="w-8 h-8 border-2 border-nerve-red border-t-transparent rounded-full animate-spin" /></div>;

  const Field = ({ label, field, type = 'number' }: { label: string; field: string; type?: string }) => (
    <div>
      <label className="text-xs font-semibold text-nerve-muted mb-1.5 block">{label}</label>
      {type === 'boolean' ? (
        <button onClick={() => setSettings({ ...settings, [field]: !settings[field] })}
          className={`relative w-12 h-6 rounded-full transition-colors ${settings[field] ? 'bg-nerve-red' : 'bg-nerve-border'}`}>
          <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${settings[field] ? 'left-6' : 'left-0.5'}`} />
        </button>
      ) : (
        <input type={type} value={settings[field]} onChange={e => setSettings({ ...settings, [field]: type === 'number' ? parseFloat(e.target.value) : e.target.value })}
          className="w-full bg-nerve-card border border-nerve-border rounded-xl px-3 py-2 text-sm text-nerve-text focus:outline-none focus:border-nerve-red/50" />
      )}
    </div>
  );

  return (
    <div className="page-content overflow-y-auto">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-nerve-text">Settings</h1>
            <p className="text-sm text-nerve-muted">Configure risk thresholds and system modes</p>
          </div>
          <motion.button onClick={handleSave} whileTap={{ scale: 0.97 }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${saved ? 'bg-nerve-green/20 border border-nerve-green/30 text-nerve-green' : 'bg-nerve-red text-white hover:bg-nerve-red-dark'}`}
            style={!saved ? { boxShadow: '0 0 16px rgba(229,25,58,0.3)' } : {}}>
            <Save size={14} /> {saved ? 'Saved!' : 'Save Settings'}
          </motion.button>
        </div>

        <div className="flex flex-col gap-4">
          <div className="glass-card p-5">
            <p className="text-xs font-semibold text-nerve-muted mb-4 uppercase tracking-wider">System Mode</p>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Demo Mode" field="demoMode" type="boolean" />
              <Field label="ESP32 Live Mode" field="esp32Mode" type="boolean" />
            </div>
          </div>

          <div className="glass-card p-5">
            <p className="text-xs font-semibold text-nerve-muted mb-4 uppercase tracking-wider">Vibration Thresholds</p>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Critical Threshold (%)" field="vibrationCriticalThreshold" />
              <Field label="Warning Threshold (%)" field="vibrationWarningThreshold" />
            </div>
          </div>

          <div className="glass-card p-5">
            <p className="text-xs font-semibold text-nerve-muted mb-4 uppercase tracking-wider">Acoustic Thresholds</p>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Critical Threshold (dB)" field="acousticCriticalThreshold" />
              <Field label="Warning Threshold (dB)" field="acousticWarningThreshold" />
            </div>
          </div>

          <div className="glass-card p-5">
            <p className="text-xs font-semibold text-nerve-muted mb-4 uppercase tracking-wider">Temperature / Freeze Thresholds</p>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Freeze Critical (°C)" field="temperatureFreezeCritical" />
              <Field label="Freeze Warning (°C)" field="temperatureFreezeWarning" />
            </div>
          </div>

          <div className="glass-card p-5">
            <p className="text-xs font-semibold text-nerve-muted mb-4 uppercase tracking-wider">Humidity Thresholds</p>
            <div className="grid grid-cols-2 gap-4">
              <Field label="High Threshold (%)" field="humidityHighThreshold" />
              <Field label="Warning Threshold (%)" field="humidityWarningThreshold" />
            </div>
          </div>

          <div className="glass-card p-5">
            <p className="text-xs font-semibold text-nerve-muted mb-4 uppercase tracking-wider">Battery & Signal Thresholds</p>
            <div className="grid grid-cols-3 gap-4">
              <Field label="Battery Low (%)" field="batteryLowThreshold" />
              <Field label="Battery Warning (%)" field="batteryWarningThreshold" />
              <Field label="Signal Weak (dBm)" field="signalWeakThreshold" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
