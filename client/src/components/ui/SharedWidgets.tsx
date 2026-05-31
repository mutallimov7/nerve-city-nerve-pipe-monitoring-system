import React from 'react';
import { CloudRain, Wind, Droplets } from 'lucide-react';

export function TopWidgets() {
  return (
    <div className="flex gap-4 mb-6">
      {/* Weather Widget */}
      <div className="glass-panel p-3 px-5 flex items-center justify-between gap-6 flex-1 min-w-[200px] relative neon-box-red">
        <div className="absolute -top-2 -right-2 bg-red-500 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-[0_0_10px_rgba(239,68,68,0.5)]">!!</div>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center text-red-500">
            <CloudRain size={20} />
          </div>
          <div>
            <p className="text-[10px] text-zinc-400 font-medium">Weather</p>
            <p className="text-xl font-bold text-white">18°C</p>
          </div>
        </div>
        <Wind size={20} className="text-zinc-300" />
      </div>

      {/* Status Widget */}
      <div className="glass-panel p-3 px-5 flex items-center gap-4 flex-1 min-w-[220px]">
        <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-500">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
        </div>
        <div>
          <p className="text-[10px] text-zinc-400 font-medium">Status of the pipes</p>
          <div className="flex items-end gap-3">
            <p className="text-xl font-bold text-white">91%</p>
            <p className="text-[8px] text-green-500 font-bold max-w-[60px] leading-tight">+12% compared to last week</p>
          </div>
        </div>
      </div>

      {/* Humidity Widget */}
      <div className="glass-panel p-3 px-5 flex items-center gap-4 flex-1 min-w-[200px] relative neon-box-blue">
        <div className="absolute -top-2 -right-2 bg-red-500 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-[0_0_10px_rgba(239,68,68,0.5)]">!</div>
        <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center text-yellow-500">
          <Droplets size={20} />
        </div>
        <div>
          <p className="text-[10px] text-zinc-400 font-medium">Humidity</p>
          <p className="text-xl font-bold text-white">48% RH</p>
        </div>
      </div>
    </div>
  );
}

export function ConditionWidget() {
  return (
    <div className="glass-panel p-4 h-full flex flex-col justify-between">
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-bold text-white">Condition "Alpha 1 nerve"</h3>
          <span className="text-xs font-bold text-zinc-500">1/1</span>
        </div>
        <div className="flex gap-2">
          <div className="flex-1 border border-zinc-800 rounded-lg flex items-center justify-center py-6 neon-box-red">
            <span className="text-3xl font-bold text-white tracking-widest">ESP</span>
          </div>
          <div className="grid grid-cols-2 gap-2 flex-1">
            {['ADXL 345', 'Voice', 'Temperature', 'Humidity'].map((sensor, i) => (
              <div key={sensor} className={`border border-zinc-800 rounded-lg p-1.5 flex flex-col justify-between ${i === 0 ? 'neon-box-green' : i === 1 ? 'neon-box-red' : i === 2 ? 'neon-box-blue' : 'neon-box-yellow'}`}>
                <span className="text-[8px] font-bold text-white leading-tight">{sensor}</span>
                <div className="flex justify-end gap-0.5 mt-2">
                  <div className="w-1.5 h-3 bg-red-500 rounded-sm"></div>
                  <div className="w-1.5 h-3 bg-zinc-700 rounded-sm"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="flex items-end gap-2 mt-4">
        <span className="text-[10px] text-zinc-500">Energy Usage</span>
        <span className="text-sm font-bold text-white">3.7 V</span>
      </div>
    </div>
  );
}
