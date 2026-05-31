import React from 'react';

export default function RiskBadge({ score }: { score: number }) {
  const color = score >= 70 ? 'text-nerve-red bg-nerve-red/10 border-nerve-red/30'
    : score >= 40 ? 'text-nerve-yellow bg-nerve-yellow/10 border-nerve-yellow/30'
    : 'text-nerve-green bg-nerve-green/10 border-nerve-green/30';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[11px] font-bold ${color}`}>
      {score}
    </span>
  );
}
