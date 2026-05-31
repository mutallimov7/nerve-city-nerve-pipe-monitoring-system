import React, { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { useNerveStore } from '../../store/useNerveStore';
import { ChevronDown } from 'lucide-react';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-nerve-card border border-nerve-border rounded-xl p-3 shadow-2xl text-xs">
      <p className="text-nerve-dim mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }} className="font-medium">
          {p.name}: <span className="font-mono">{p.value?.toFixed(1)}</span>
        </p>
      ))}
    </div>
  );
};

export default function StatusChart() {
  const { devices } = useNerveStore();
  const [range, setRange] = useState('Hourly');

  // Build chart data from device readings (mock from current values with slight variation)
  const now = Date.now();
  const points = 24;
  const data = Array.from({ length: points }, (_, i) => {
    const label = new Date(now - (points - 1 - i) * 60 * 60 * 1000 / (range === 'Hourly' ? 1 : range === 'Daily' ? 24 : 168))
      .toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const avgRisk = devices.reduce((acc, d) => acc + d.latestRiskScore, 0) / (devices.length || 1);
    const noise = (Math.random() - 0.5) * 20;
    const risk = Math.max(0, Math.min(100, avgRisk + noise + (i - 12) * 0.5));
    return {
      time: label,
      riskScore: +risk.toFixed(1),
      vibration: +(devices.reduce((acc, d) => acc + d.latestVibrationLevel, 0) / (devices.length || 1) + (Math.random() - 0.5) * 15).toFixed(1),
      acoustic: +(devices.reduce((acc, d) => acc + d.latestAcousticLevel, 0) / (devices.length || 1) + (Math.random() - 0.5) * 10).toFixed(1),
    };
  });

  return (
    <div className="glass-card p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-nerve-text">Current Status of Nerve Devices</h3>
          <p className="text-xs text-nerve-dim mt-0.5">Risk score trend across all nodes</p>
        </div>
        <div className="relative">
          <select
            value={range}
            onChange={(e) => setRange(e.target.value)}
            className="appearance-none bg-nerve-card border border-nerve-border rounded-lg px-3 py-1.5 text-xs text-nerve-text pr-7 cursor-pointer focus:outline-none focus:border-nerve-red/50"
          >
            <option>Hourly</option>
            <option>Daily</option>
            <option>Weekly</option>
          </select>
          <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-nerve-dim pointer-events-none" />
        </div>
      </div>

      <div className="relative h-44">
        {/* Background risk bands */}
        <div className="absolute inset-0 pointer-events-none z-0" style={{ paddingRight: '5%', paddingLeft: '3%' }}>
          <div className="w-full h-full flex flex-col">
            <div className="h-[30%] rounded-t" style={{ background: 'rgba(229,25,58,0.06)' }} />
            <div className="h-[30%]" style={{ background: 'rgba(234,179,8,0.06)' }} />
            <div className="h-[40%] rounded-b" style={{ background: 'rgba(34,197,94,0.04)' }} />
          </div>
        </div>

        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
            <defs>
              <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#e5193a" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#e5193a" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="vibGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f97316" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e2330" vertical={false} />
            <XAxis dataKey="time" tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} axisLine={false} interval={Math.floor(points / 6)} />
            <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} axisLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={70} stroke="#e5193a" strokeDasharray="3 3" strokeOpacity={0.4} label={{ value: 'Critical', fill: '#e5193a', fontSize: 9, position: 'insideTopRight' }} />
            <ReferenceLine y={40} stroke="#eab308" strokeDasharray="3 3" strokeOpacity={0.4} label={{ value: 'Warning', fill: '#eab308', fontSize: 9, position: 'insideTopRight' }} />
            <Area type="monotone" dataKey="riskScore" stroke="#e5193a" strokeWidth={2} fill="url(#riskGrad)" name="Risk Score" dot={false} activeDot={{ r: 4, fill: '#e5193a', strokeWidth: 0 }} />
            <Area type="monotone" dataKey="vibration" stroke="#f97316" strokeWidth={1.5} fill="url(#vibGrad)" name="Vibration" dot={false} activeDot={{ r: 3, fill: '#f97316', strokeWidth: 0 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center gap-4 mt-2">
        {[['Risk Score', '#e5193a'], ['Vibration', '#f97316']].map(([label, color]) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 rounded" style={{ background: color }} />
            <span className="text-[10px] text-nerve-dim">{label}</span>
          </div>
        ))}
        <div className="ml-auto flex items-center gap-3">
          {[['Normal', '#22c55e'], ['Medium', '#eab308'], ['High', '#e5193a']].map(([l, c]) => (
            <div key={l} className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 rounded-sm opacity-40" style={{ background: c }} />
              <span className="text-[10px] text-nerve-dim">{l}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
