import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import { useNerveStore } from '../store/useNerveStore';
import { getMapData, getDevices } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, Activity, Volume2, Thermometer, Droplets, Battery, Wifi } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

const statusColor = (s: string) => s === 'CRITICAL' ? '#e5193a' : s === 'WARNING' ? '#eab308' : s === 'SAFE' ? '#22c55e' : '#6b7280';
const statusGlow = (s: string) => s === 'CRITICAL' ? 'nerve-marker-critical' : s === 'WARNING' ? 'nerve-marker-warning' : 'nerve-marker-safe';

function MapResizer() {
  const map = useMap();
  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 300);
    return () => clearTimeout(t);
  }, [map]);
  return null;
}

export default function MapPage() {
  const { devices } = useNerveStore();
  const [mapData, setMapData] = useState<any>(null);
  const [selectedDevice, setSelectedDevice] = useState<any>(null);
  const [mapMode, setMapMode] = useState<'normal' | 'heatmap' | 'focus'>('normal');
  const [mapKey, setMapKey] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    getMapData().then(setMapData).catch(console.error);
    if (devices.length === 0) getDevices().then(d => useNerveStore.getState().setDevices(d)).catch(console.error);
    const t = setTimeout(() => setMapKey(1), 300);
    return () => clearTimeout(t);
  }, []);

  const allDevices = mapData?.devices || devices;
  const issues = mapData?.issues || [];
  const reports = mapData?.reports || [];

  return (
    <div style={{ height: 'calc(100vh - 64px)', minHeight: 0 }} className="w-full relative overflow-hidden">
      {/* Map */}
      <MapContainer
        key={mapKey}
        center={[40.4155, 49.858]}
        zoom={15}
        zoomControl={true}
        style={{ width: '100%', height: '100%' }}
      >
        <MapResizer />
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org">OSM</a>'
        />

        {/* Device markers */}
        {allDevices.map((d: any) => (
          <CircleMarker
            key={d.deviceId}
            center={[d.latitude, d.longitude]}
            radius={d.currentStatus === 'CRITICAL' ? 10 : 8}
            pathOptions={{
              color: statusColor(d.currentStatus),
              fillColor: statusColor(d.currentStatus),
              fillOpacity: 0.8,
              weight: 2,
            }}
            className={statusGlow(d.currentStatus)}
            eventHandlers={{ click: () => setSelectedDevice(d) }}
          >
            <Popup>
              <div className="text-xs min-w-[220px]">
                <p className="font-bold text-sm mb-1" style={{ color: statusColor(d.currentStatus) }}>{d.deviceId}</p>
                <p className="text-nerve-muted mb-2">{d.locationName}</p>
                <div className="grid grid-cols-2 gap-1.5">
                  <div><span className="text-nerve-dim">Risk:</span> <span className="font-mono font-bold" style={{ color: statusColor(d.currentStatus) }}>{d.latestRiskScore}</span></div>
                  <div><span className="text-nerve-dim">Status:</span> <span className="font-bold" style={{ color: statusColor(d.currentStatus) }}>{d.currentStatus}</span></div>
                  <div><span className="text-nerve-dim">Vibration:</span> <span className="font-mono">{d.latestVibrationLevel}</span></div>
                  <div><span className="text-nerve-dim">Acoustic:</span> <span className="font-mono">{d.latestAcousticLevel}</span></div>
                  <div><span className="text-nerve-dim">Temp:</span> <span className="font-mono">{d.latestTemperature}°C</span></div>
                  <div><span className="text-nerve-dim">Humidity:</span> <span className="font-mono">{d.latestHumidity}%</span></div>
                  <div><span className="text-nerve-dim">Battery:</span> <span className="font-mono">{d.latestBattery}%</span></div>
                  <div><span className="text-nerve-dim">Signal:</span> <span className="font-mono">{d.latestSignalStrength} dBm</span></div>
                </div>
                <p className="mt-2 text-[10px] text-nerve-dim">Mode: {d.currentMode}</p>
                <button
                  onClick={() => navigate(`/devices/${d.deviceId}`)}
                  className="mt-2 w-full py-1.5 bg-nerve-red text-white rounded-lg text-[11px] font-medium hover:bg-nerve-red-dark transition-colors"
                >
                  Open Detail View
                </button>
              </div>
            </Popup>
          </CircleMarker>
        ))}

        {/* Issue markers */}
        {issues.filter((i: any) => i.latitude).map((i: any) => (
          <CircleMarker key={i.issueId} center={[i.latitude, i.longitude]} radius={6}
            pathOptions={{ color: '#f97316', fillColor: '#f97316', fillOpacity: 0.6, weight: 1 }}>
            <Popup><div className="text-xs"><p className="font-bold text-nerve-orange">{i.title}</p><p className="text-nerve-dim mt-1">{i.status}</p></div></Popup>
          </CircleMarker>
        ))}

        {/* Report markers */}
        {reports.map((r: any) => (
          <CircleMarker key={r.reportId} center={[r.latitude, r.longitude]} radius={5}
            pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.5, weight: 1 }}>
            <Popup><div className="text-xs"><p className="font-bold text-nerve-blue">{r.category}</p><p className="text-nerve-dim mt-1">{r.description?.slice(0, 80)}...</p></div></Popup>
          </CircleMarker>
        ))}
      </MapContainer>

      {/* Map Mode Toggle */}
      <div className="absolute top-4 left-4 z-[1000] flex flex-col gap-1">
        {['normal', 'heatmap', 'focus'].map(mode => (
          <button key={mode} onClick={() => setMapMode(mode as any)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${mapMode === mode ? 'bg-nerve-red text-white' : 'bg-nerve-surface/90 text-nerve-dim hover:text-nerve-text border border-nerve-border'}`}
          >{mode === 'normal' ? '📍 Normal' : mode === 'heatmap' ? '🌡️ Heatmap' : '🔍 Focus'}</button>
        ))}
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-[1000] bg-nerve-surface/95 backdrop-blur-sm rounded-xl p-3 border border-nerve-border text-[10px]">
        <p className="font-semibold text-nerve-text mb-2">LEGEND</p>
        {[{ c: '#22c55e', l: 'Safe Device' }, { c: '#eab308', l: 'Warning Device' }, { c: '#e5193a', l: 'Critical Device' }, { c: '#3b82f6', l: 'Citizen Report' }, { c: '#f97316', l: 'Active Issue' }, { c: '#6b7280', l: 'Offline' }].map(x => (
          <div key={x.l} className="flex items-center gap-2 mt-1">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: x.c }} />
            <span className="text-nerve-muted">{x.l}</span>
          </div>
        ))}
      </div>

      {/* Focus Panel */}
      <AnimatePresence>
        {selectedDevice && (
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
            transition={{ duration: 0.3 }}
            className="absolute top-4 right-4 bottom-4 w-80 z-[1000] bg-nerve-surface/95 backdrop-blur-xl rounded-2xl border border-nerve-border overflow-y-auto shadow-2xl"
          >
            <div className="p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-nerve-text">{selectedDevice.deviceId}</h3>
                <button onClick={() => setSelectedDevice(null)} className="w-7 h-7 rounded-lg bg-nerve-card flex items-center justify-center text-nerve-dim hover:text-nerve-text"><X size={14} /></button>
              </div>
              <div className="mb-3">
                <span className="text-3xl font-bold font-mono" style={{ color: statusColor(selectedDevice.currentStatus) }}>{selectedDevice.latestRiskScore}</span>
                <span className="ml-2 text-xs font-bold" style={{ color: statusColor(selectedDevice.currentStatus) }}>{selectedDevice.currentStatus}</span>
              </div>
              <p className="text-[10px] text-nerve-dim mb-1">Mode: {selectedDevice.currentMode}</p>
              <p className="text-[10px] text-nerve-dim mb-4">{selectedDevice.locationName}</p>

              <div className="bg-nerve-bg rounded-xl p-3 mb-4">
                <p className="text-[10px] font-semibold text-nerve-dim uppercase tracking-wider mb-2">Sensor Values</p>
                {[
                  { icon: Activity, l: 'Vibration', v: selectedDevice.latestVibrationLevel },
                  { icon: Volume2, l: 'Acoustic', v: selectedDevice.latestAcousticLevel },
                  { icon: Thermometer, l: 'Temperature', v: `${selectedDevice.latestTemperature}°C` },
                  { icon: Droplets, l: 'Humidity', v: `${selectedDevice.latestHumidity}%` },
                  { icon: Battery, l: 'Battery', v: `${selectedDevice.latestBattery}%` },
                  { icon: Wifi, l: 'Signal', v: `${selectedDevice.latestSignalStrength} dBm` },
                ].map(x => (
                  <div key={x.l} className="flex items-center justify-between py-1.5 border-b border-nerve-border/20 last:border-0">
                    <div className="flex items-center gap-2"><x.icon size={12} className="text-nerve-dim" /><span className="text-[11px] text-nerve-muted">{x.l}</span></div>
                    <span className="text-[11px] font-mono font-semibold text-nerve-text">{x.v}</span>
                  </div>
                ))}
              </div>

              <p className="text-[10px] text-nerve-dim mb-1">Activity: {selectedDevice.latestActivityLevel}</p>
              <p className="text-[10px] text-nerve-dim mb-4">Last Update: {new Date(selectedDevice.lastUpdate).toLocaleString()}</p>

              <button onClick={() => navigate(`/devices/${selectedDevice.deviceId}`)}
                className="w-full py-2 bg-nerve-red text-white rounded-xl text-xs font-medium hover:bg-nerve-red-dark transition-colors flex items-center justify-center gap-2">
                <ExternalLink size={12} /> Open Full Detail
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
