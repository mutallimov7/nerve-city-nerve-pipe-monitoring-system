import React from 'react';
import { motion } from 'framer-motion';
import { Cpu, AlertTriangle, CheckCircle, XCircle, WifiOff, FileText, Clock } from 'lucide-react';
import { useNerveStore } from '../../store/useNerveStore';

interface CardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
  glow: string;
}

function SummaryCard({ icon, label, value, sub, color, glow }: CardProps) {
  return (
    <motion.div
      className="glass-card glass-card-hover p-4 flex items-center gap-4 cursor-default"
      whileHover={{ y: -3 }}
      transition={{ duration: 0.2 }}
      style={{ '--glow-color': glow } as any}
    >
      <div className="p-3 rounded-xl flex-shrink-0" style={{ background: `${color}18`, boxShadow: `0 0 16px ${color}20` }}>
        <span style={{ color }}>{icon}</span>
      </div>
      <div className="min-w-0">
        <motion.p
          key={String(value)}
          initial={{ opacity: 0, y: 3 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl font-bold text-nerve-text font-mono leading-none"
        >
          {value}
        </motion.p>
        <p className="text-xs text-nerve-muted mt-1 truncate">{label}</p>
        {sub && <p className="text-[10px] text-nerve-dim mt-0.5">{sub}</p>}
      </div>
    </motion.div>
  );
}

export default function SummaryCards() {
  const { summary, devices } = useNerveStore();
  const s = summary;

  if (!s) return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="glass-card h-20 animate-pulse bg-nerve-card/50" />
      ))}
    </div>
  );

  const cards = [
    { icon: <Cpu size={20} />, label: 'Total Devices', value: s.totalDevices, color: '#8b5cf6', glow: '#8b5cf633' },
    { icon: <CheckCircle size={20} />, label: 'Safe Devices', value: s.safe, sub: `${s.avgBattery}% avg battery`, color: '#22c55e', glow: '#22c55e33' },
    { icon: <AlertTriangle size={20} />, label: 'Warning', value: s.warning, sub: `${s.avgVibration} avg vibration`, color: '#eab308', glow: '#eab30833' },
    { icon: <XCircle size={20} />, label: 'Critical', value: s.critical, sub: s.critical > 0 ? 'Requires attention' : 'All clear', color: '#e5193a', glow: '#e5193a33' },
    { icon: <WifiOff size={20} />, label: 'Offline', value: s.offline, color: '#6b7280', glow: '#6b728033' },
    { icon: <FileText size={20} />, label: 'Active Issues', value: s.activeIssues, sub: s.delayedIssues > 0 ? `${s.delayedIssues} delayed` : 'On schedule', color: '#f97316', glow: '#f9731633' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {cards.map((c, i) => (
        <motion.div
          key={c.label}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.06, duration: 0.35 }}
        >
          <SummaryCard {...c} />
        </motion.div>
      ))}
    </div>
  );
}
