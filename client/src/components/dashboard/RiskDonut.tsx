import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useNerveStore } from '../../store/useNerveStore';
import { useNavigate } from 'react-router-dom';
import { Map } from 'lucide-react';
import { motion } from 'framer-motion';

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-nerve-card border border-nerve-border rounded-xl p-2.5 shadow-2xl text-xs">
      <p style={{ color: payload[0].payload.color }} className="font-semibold">{payload[0].name}</p>
      <p className="text-nerve-muted font-mono">{payload[0].value} zones</p>
    </div>
  );
};

export default function RiskDonut() {
  const { summary } = useNerveStore();
  const navigate = useNavigate();

  if (!summary) return <div className="glass-card h-48 animate-pulse" />;

  const data = [
    { name: 'Critical', value: summary.critical, color: '#e5193a' },
    { name: 'Warning', value: summary.warning, color: '#eab308' },
    { name: 'Safe', value: summary.safe, color: '#22c55e' },
    { name: 'Offline', value: summary.offline, color: '#374151' },
  ].filter((d) => d.value > 0);

  const total = summary.totalDevices || 1;

  return (
    <div className="glass-card p-4 flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-nerve-text">Risk Zone Distribution</h3>
      </div>

      <div className="flex items-center gap-4 flex-1">
        <div className="relative w-32 h-32 flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} cx="50%" cy="50%" innerRadius={40} outerRadius={60}
                paddingAngle={3} dataKey="value" strokeWidth={0}>
                {data.map((entry, i) => (
                  <Cell key={i} fill={entry.color}
                    style={{ filter: entry.name === 'Critical' ? 'drop-shadow(0 0 4px #e5193a)' : 'none' }} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex items-center justify-center flex-col">
            <span className="text-xl font-bold text-nerve-text font-mono">{summary.networkHealthPct}%</span>
            <span className="text-[9px] text-nerve-dim">Health</span>
          </div>
        </div>

        <div className="flex flex-col gap-2 flex-1">
          {data.map((d) => (
            <div key={d.name} className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: d.color }} />
              <span className="text-xs text-nerve-muted flex-1">{d.name}</span>
              <span className="text-xs font-mono font-semibold text-nerve-text">{d.value}</span>
              <div className="w-16 h-1.5 rounded-full bg-nerve-border overflow-hidden">
                <motion.div className="h-full rounded-full"
                  style={{ background: d.color, width: `${(d.value / total) * 100}%` }}
                  initial={{ width: 0 }} animate={{ width: `${(d.value / total) * 100}%` }}
                  transition={{ duration: 0.6, delay: 0.2 }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={() => navigate('/map')}
        className="mt-3 w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-nerve-card border border-nerve-border text-xs text-nerve-muted hover:text-nerve-text hover:border-nerve-red/40 transition-all"
      >
        <Map size={13} />
        View on Map
      </button>
    </div>
  );
}
