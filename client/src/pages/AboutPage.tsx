import React from 'react';
import { Radio, Cpu, Wifi, Thermometer, Activity, Volume2, Shield, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AboutPage() {
  const features = [
    { icon: <Cpu size={18} />, title: 'ESP32 Sensor Node', desc: 'Non-invasive external pipe monitoring box — no drilling or cutting required' },
    { icon: <Activity size={18} />, title: 'Vibration Detection', desc: 'ADXL345 accelerometer measures vibration and acceleration (X, Y, Z axes)' },
    { icon: <Volume2 size={18} />, title: 'Acoustic Monitoring', desc: 'Microphone sensor detects unusual sound activity around the pipe' },
    { icon: <Thermometer size={18} />, title: 'Environmental Sensing', desc: 'DHT11/DHT22 measures temperature and humidity for freeze and moisture risk' },
    { icon: <Wifi size={18} />, title: 'Wi-Fi Connectivity', desc: 'ESP32 sends JSON data over Wi-Fi to the backend API in real time' },
    { icon: <Shield size={18} />, title: 'AI-Assisted Risk Engine', desc: 'Sensor fusion-based anomaly detection — prototype risk engine calculates live risk scores' },
  ];

  return (
    <div className="page-content overflow-y-auto">
      <div className="max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-nerve-red/10 border border-nerve-red/30 flex items-center justify-center mx-auto mb-4" style={{ boxShadow: '0 0 32px rgba(229,25,58,0.2)' }}>
            <Radio size={28} className="text-nerve-red" />
          </div>
          <h1 className="text-3xl font-bold text-nerve-text mb-2">Nerve</h1>
          <p className="text-nerve-muted text-base">AI-assisted non-invasive pipe monitoring and municipal risk management platform</p>
          <div className="flex items-center justify-center gap-2 mt-3">
            <div className="w-2 h-2 rounded-full bg-nerve-red animate-pulse" />
            <span className="text-xs text-nerve-red font-medium">Hackathon Prototype — AI-Assisted Prototype Risk Engine</span>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          {features.map((f, i) => (
            <motion.div key={f.title} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              className="glass-card glass-card-hover p-4 flex gap-3">
              <div className="p-2.5 rounded-xl bg-nerve-red/10 flex-shrink-0" style={{ color: '#e5193a' }}>{f.icon}</div>
              <div>
                <p className="text-sm font-semibold text-nerve-text mb-1">{f.title}</p>
                <p className="text-xs text-nerve-muted">{f.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="glass-card p-6 mb-4">
          <p className="text-xs font-semibold text-nerve-muted mb-3 uppercase tracking-wider">Prototype Limitations</p>
          {[
            '⚠️ Does NOT include direct water pressure sensor in current MVP',
            '⚠️ Does NOT include direct water leak sensor in current MVP',
            '⚠️ Does NOT claim GPS works underground',
            '⚠️ Does NOT claim AI is fully trained on real municipal data',
            '✅ MVP estimates pipe activity, vibration anomaly, acoustic anomaly, freeze risk, humidity risk',
            '✅ Real pilot data will improve the AI model over time',
            '✅ Pressure and direct leak detection can be added as industrial sensor modules later',
          ].map((l, i) => (
            <p key={i} className={`text-xs mb-1.5 ${l.startsWith('✅') ? 'text-nerve-green' : 'text-nerve-muted'}`}>{l}</p>
          ))}
        </div>

        <div className="glass-card p-6">
          <p className="text-xs font-semibold text-nerve-muted mb-3 uppercase tracking-wider">ESP32 JSON Payload Format</p>
          <pre className="text-xs font-mono text-nerve-green bg-nerve-bg rounded-xl p-4 overflow-x-auto">
{`POST http://localhost:4000/api/sensor-data

{
  "deviceId": "NERVE-NAR-001",
  "accelX": 0.123,
  "accelY": -0.041,
  "accelZ": 9.812,
  "rawVibration": 0.0842,
  "vibrationLevel": 72.4,
  "baseline": 0.0215,
  "acousticLevel": 68.5,
  "micPeakToPeak": 2806,
  "soundStatus": "HIGH SOUND",
  "temperature": 24.5,
  "humidity": 58.2,
  "battery": 76,
  "signalStrength": -62,
  "source": "esp32",
  "uptimeMs": 154230
}`}
          </pre>
        </div>
      </div>
    </div>
  );
}
