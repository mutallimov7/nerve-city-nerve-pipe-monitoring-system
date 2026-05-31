import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Thermometer, Battery, Wifi, Activity, Volume2, WifiOff, Clock } from 'lucide-react';
import { useNerveStore } from '../../store/useNerveStore';

const alertIcons: Record<string, React.ReactNode> = {
  'Mechanical Anomaly': <Activity size={14} />,
  'Acoustic Anomaly': <Volume2 size={14} />,
  'Freeze Risk': <Thermometer size={14} />,
  'Humidity Risk': <Thermometer size={14} />,
  'Low Battery': <Battery size={14} />,
  'Weak Signal': <Wifi size={14} />,
  'Offline': <WifiOff size={14} />,
  'default': <AlertTriangle size={14} />,
};

const severityConfig: Record<string, { color: string; border: string; bg: string; badge: string }> = {
  CRITICAL: { color: '#e5193a', border: 'border-nerve-red/40', bg: 'bg-nerve-red/5', badge: 'bg-nerve-red/20 text-nerve-red' },
  HIGH:     { color: '#f97316', border: 'border-orange-500/40', bg: 'bg-orange-500/5', badge: 'bg-orange-500/20 text-orange-400' },
  MEDIUM:   { color: '#eab308', border: 'border-yellow-500/40', bg: 'bg-yellow-500/5', badge: 'bg-yellow-500/20 text-yellow-400' },
  LOW:      { color: '#22c55e', border: 'border-nerve-green/30', bg: 'bg-nerve-green/5', badge: 'bg-nerve-green/20 text-nerve-green' },
};

function timeAgo(ts: string) {
  const diff = (Date.now() - new Date(ts).getTime()) / 1000;
  if (diff < 60) return `${Math.round(diff)}s ago`;
  if (diff < 3600) return `${Math.round(diff / 60)}m ago`;
  return `${Math.round(diff / 3600)}h ago`;
}

export default function AlertPanel() {
  const { alerts } = useNerveStore();
  const active = alerts.filter((a) => !a.resolved).slice(0, 8);

  return (
    <div className="glass-card p-4 flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-nerve-text">Important Alerts</h3>
        <span className="text-[10px] text-nerve-dim bg-nerve-card border border-nerve-border px-2 py-0.5 rounded-full">
          {active.length} active
        </span>
      </div>

      <div className="flex flex-col gap-2 overflow-y-auto flex-1">
        <AnimatePresence mode="popLayout">
          {active.length === 0 && (
            <div className="flex flex-col items-center justify-center h-32 text-nerve-dim">
              <AlertTriangle size={24} className="mb-2 opacity-30" />
              <p className="text-xs">No active alerts</p>
            </div>
          )}
          {active.map((alert, i) => {
            const sc = severityConfig[alert.severity] || severityConfig.LOW;
            const icon = alertIcons[alert.alertType] || alertIcons.default;
            return (
              <motion.div
                key={alert.alertId}
                layout
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: i * 0.05, duration: 0.25 }}
                className={`p-3 rounded-xl border ${sc.border} ${sc.bg} transition-all cursor-pointer hover:-translate-y-0.5 ${alert.severity === 'CRITICAL' ? 'animate-pulse-red' : ''}`}
                style={{ boxShadow: `0 0 0 0 ${sc.color}` }}
                whileHover={{ scale: 1.01 }}
              >
                <div className="flex items-start gap-2">
                  <div className="p-1.5 rounded-lg mt-0.5 flex-shrink-0" style={{ background: `${sc.color}22`, color: sc.color }}>
                    {icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-xs font-semibold text-nerve-text truncate">{alert.alertType}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ml-auto flex-shrink-0 ${sc.badge}`}>
                        {alert.severity}
                      </span>
                    </div>
                    <p className="text-[11px] text-nerve-muted line-clamp-2">{alert.message}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[10px] text-nerve-dim">{alert.deviceId}</span>
                      <span className="text-nerve-border">·</span>
                      <span className="text-[10px] text-nerve-dim flex items-center gap-1">
                        <Clock size={9} /> {timeAgo(alert.timestamp)}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
