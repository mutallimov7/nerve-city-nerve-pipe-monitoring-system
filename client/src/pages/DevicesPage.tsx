import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNerveStore } from '../store/useNerveStore';
import { getDevices, setDeviceOffline, setDeviceOnline, simulateReading } from '../services/api';
import { motion } from 'framer-motion';
import { Eye, WifiOff, Wifi, Zap } from 'lucide-react';

const statusColor = (s: string) => s === 'CRITICAL' ? '#e5193a' : s === 'WARNING' ? '#eab308' : '#22c55e';

export default function DevicesPage() {
  const { devices, setDevices } = useNerveStore();
  const navigate = useNavigate();

  useEffect(() => {
    getDevices().then(setDevices).catch(console.error);
  }, []);

  const handleOffline = async (id: string) => { await setDeviceOffline(id); getDevices().then(setDevices); };
  const handleOnline  = async (id: string) => { await setDeviceOnline(id);  getDevices().then(setDevices); };
  const handleSim     = async (id: string) => { await simulateReading(id, 'normal'); };

  const colH = 'px-3 py-3 font-semibold text-[12px] uppercase tracking-wider';

  return (
    <div className="page-content">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-nerve-text">Devices</h1>
        <p className="text-sm text-nerve-muted mt-1">All registered Nerve sensor nodes · {devices.length} devices</p>
      </div>

      <div className="glass-card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-nerve-dim text-left border-b border-nerve-border">
              {[
                'Device ID', 'Name', 'Location', 'Type', 'Status', 'Mode',
                'Risk', 'Vibration', 'Acoustic', 'Temp', 'Humidity',
                'Battery', 'Signal', 'Activity', 'Source', 'Last Update', 'Actions',
              ].map(h => <th key={h} className={`${colH} whitespace-nowrap`}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {devices.map((d, i) => (
              <motion.tr
                key={d.deviceId}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.04 }}
                className="border-b border-nerve-border/30 hover:bg-nerve-card/50 transition-colors cursor-pointer text-[13px]"
                onClick={() => navigate(`/devices/${d.deviceId}`)}
              >
                <td className="px-3 py-3 font-mono font-semibold text-nerve-text">{d.deviceId}</td>
                <td className="px-3 py-3 text-nerve-muted">{d.name}</td>
                <td className="px-3 py-3 text-nerve-muted max-w-[130px] truncate">{d.locationName}</td>
                <td className="px-3 py-3 text-nerve-dim">{d.installationType}</td>
                <td className="px-3 py-3">
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
                <td className="px-3 py-3 text-nerve-dim text-[11px] max-w-[110px] truncate">{d.currentMode}</td>
                <td className="px-3 py-3 font-mono font-bold" style={{ color: statusColor(d.currentStatus) }}>{d.latestRiskScore}</td>
                <td className="px-3 py-3 font-mono">{d.latestVibrationLevel}</td>
                <td className="px-3 py-3 font-mono">{d.latestAcousticLevel}</td>
                <td className="px-3 py-3 font-mono">{d.latestTemperature}°C</td>
                <td className="px-3 py-3 font-mono">{d.latestHumidity}%</td>
                <td className="px-3 py-3 font-mono">{d.latestBattery}%</td>
                <td className="px-3 py-3 font-mono">{d.latestSignalStrength}</td>
                <td className="px-3 py-3 text-[11px] text-nerve-muted">{d.latestActivityLevel}</td>
                <td className="px-3 py-3 text-[11px]">
                  <span className={d.isOnline ? 'text-nerve-green font-semibold' : 'text-nerve-red font-semibold'}>
                    {d.isOnline ? 'Online' : 'Offline'}
                  </span>
                </td>
                <td className="px-3 py-3 text-[11px] text-nerve-dim font-mono">{new Date(d.lastUpdate).toLocaleTimeString()}</td>
                <td className="px-3 py-3" onClick={e => e.stopPropagation()}>
                  <div className="flex gap-1.5">
                    <button onClick={() => navigate(`/devices/${d.deviceId}`)}
                      className="w-7 h-7 rounded-lg bg-nerve-card border border-nerve-border flex items-center justify-center text-nerve-dim hover:text-nerve-text" title="View">
                      <Eye size={13} />
                    </button>
                    <button onClick={() => handleSim(d.deviceId)}
                      className="w-7 h-7 rounded-lg bg-nerve-card border border-nerve-border flex items-center justify-center text-nerve-dim hover:text-nerve-yellow" title="Simulate">
                      <Zap size={13} />
                    </button>
                    {d.isOnline ? (
                      <button onClick={() => handleOffline(d.deviceId)}
                        className="w-7 h-7 rounded-lg bg-nerve-card border border-nerve-border flex items-center justify-center text-nerve-dim hover:text-nerve-red" title="Mark Offline">
                        <WifiOff size={13} />
                      </button>
                    ) : (
                      <button onClick={() => handleOnline(d.deviceId)}
                        className="w-7 h-7 rounded-lg bg-nerve-card border border-nerve-border flex items-center justify-center text-nerve-dim hover:text-nerve-green" title="Mark Online">
                        <Wifi size={13} />
                      </button>
                    )}
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
