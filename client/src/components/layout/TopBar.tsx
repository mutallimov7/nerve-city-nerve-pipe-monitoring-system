import React, { useState, useEffect } from 'react';
import { Search, Bell, Wifi, WifiOff, Clock, Sun, Moon } from 'lucide-react';
import { useNerveStore } from '../../store/useNerveStore';
import { motion, AnimatePresence } from 'framer-motion';

export default function TopBar() {
  const { connected, lastUpdate, alerts, liveReading } = useNerveStore();
  const [secAgo, setSecAgo] = useState(0);
  const [showAlerts, setShowAlerts] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem('nerve-theme') || 'dark');

  const unread = alerts.filter((a) => !a.resolved).slice(0, 5);

  /* ── Clock tick ── */
  useEffect(() => {
    const id = setInterval(() => {
      if (lastUpdate) setSecAgo(Math.floor((Date.now() - lastUpdate.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [lastUpdate]);

  /* ── Theme apply ── */
  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('theme-light');
    } else {
      document.documentElement.classList.remove('theme-light');
    }
    localStorage.setItem('nerve-theme', theme);
  }, [theme]);

  return (
    <header className="h-16 flex items-center gap-3 px-5 border-b border-nerve-border bg-nerve-surface relative z-40 shrink-0">
      {/* Search */}
      <div className="flex-1 max-w-xl relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-nerve-dim" />
        <input
          className="w-full bg-nerve-card border border-nerve-border rounded-xl pl-9 pr-4 py-2.5 text-sm text-nerve-text placeholder:text-nerve-dim focus:outline-none focus:border-nerve-red/50 transition-colors"
          placeholder="Search devices, zones, reports..."
        />
      </div>

      {/* Data source badge */}
      {liveReading && (
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-nerve-card border border-nerve-border text-xs font-semibold">
          <span
            className={`w-2 h-2 rounded-full ${
              liveReading.source === 'esp32' ? 'bg-nerve-green animate-pulse' : 'bg-nerve-yellow animate-pulse'
            }`}
          />
          <span className="text-nerve-muted">
            {liveReading.source === 'esp32' ? 'ESP32 Live' : 'Simulation'}
          </span>
        </div>
      )}

      {/* Connection status */}
      <div
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm border font-semibold ${
          connected
            ? 'border-nerve-green/30 bg-nerve-green/10 text-nerve-green'
            : 'border-nerve-red/30  bg-nerve-red/10  text-nerve-red'
        }`}
      >
        {connected ? <Wifi size={14} /> : <WifiOff size={14} />}
        <span>{connected ? 'Live' : 'Offline'}</span>
        {connected && lastUpdate && (
          <span className="text-nerve-dim flex items-center gap-1 text-xs">
            <Clock size={12} />
            {secAgo < 5 ? 'just now' : `${secAgo}s ago`}
          </span>
        )}
      </div>

      {/* Notification bell */}
      <div className="relative">
        <button
          onClick={() => setShowAlerts(!showAlerts)}
          className="relative w-9 h-9 rounded-xl bg-nerve-card border border-nerve-border flex items-center justify-center text-nerve-dim hover:text-nerve-text hover:border-nerve-red/40 transition-all"
        >
          <Bell size={16} />
          {unread.length > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-nerve-red rounded-full text-[9px] font-bold text-white flex items-center justify-center animate-pulse-red">
              {unread.length}
            </span>
          )}
        </button>

        <AnimatePresence>
          {showAlerts && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-11 w-80 bg-nerve-card border border-nerve-border rounded-xl shadow-2xl z-50 overflow-hidden"
            >
              <div className="p-3 border-b border-nerve-border">
                <p className="text-sm font-semibold text-nerve-text">Recent Alerts</p>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {unread.length === 0 && (
                  <p className="text-sm text-nerve-dim p-4 text-center">No active alerts</p>
                )}
                {unread.map((a) => (
                  <div key={a.alertId} className="p-3 border-b border-nerve-border/50 hover:bg-nerve-surface transition-colors">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          a.severity === 'CRITICAL' ? 'bg-nerve-red' : a.severity === 'HIGH' ? 'bg-nerve-orange' : 'bg-nerve-yellow'
                        }`}
                      />
                      <span className="text-[13px] font-medium text-nerve-text">{a.alertType}</span>
                      <span className="ml-auto text-[11px] text-nerve-dim">{a.deviceId}</span>
                    </div>
                    <p className="text-[12px] text-nerve-muted line-clamp-2">{a.message}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Theme toggle */}
      <button
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        className="w-9 h-9 rounded-xl bg-nerve-card border border-nerve-border flex items-center justify-center text-nerve-dim hover:text-nerve-text hover:border-nerve-red/40 transition-all"
        title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
      >
        {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
      </button>
    </header>
  );
}
