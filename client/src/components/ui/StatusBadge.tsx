import React from 'react';

interface Props {
  status: string;
  size?: 'sm' | 'md';
}

const config: Record<string, { label: string; color: string; dot: string }> = {
  SAFE:     { label: 'Safe',     color: 'text-nerve-green bg-nerve-green/10 border-nerve-green/30',  dot: 'bg-nerve-green' },
  WARNING:  { label: 'Warning',  color: 'text-nerve-yellow bg-nerve-yellow/10 border-nerve-yellow/30', dot: 'bg-nerve-yellow' },
  CRITICAL: { label: 'Critical', color: 'text-nerve-red bg-nerve-red/10 border-nerve-red/30',        dot: 'bg-nerve-red animate-pulse' },
  OFFLINE:  { label: 'Offline',  color: 'text-nerve-gray bg-nerve-gray/10 border-nerve-gray/30',    dot: 'bg-nerve-gray' },
  NEW:      { label: 'New',      color: 'text-nerve-blue bg-nerve-blue/10 border-nerve-blue/30',    dot: 'bg-nerve-blue' },
};

export default function StatusBadge({ status, size = 'sm' }: Props) {
  const c = config[status?.toUpperCase()] || config.OFFLINE;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border font-medium ${c.color} ${size === 'md' ? 'text-xs' : 'text-[11px]'}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
}
