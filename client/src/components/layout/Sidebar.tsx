import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Map, Cpu, FlaskConical,
  AlertTriangle, FileText, Archive, Settings, Info,
} from 'lucide-react';

const navItems = [
  { path: '/',           icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/map',        icon: Map,             label: 'Live Map' },
  { path: '/devices',    icon: Cpu,             label: 'Devices' },
  { path: '/simulation', icon: FlaskConical,    label: 'Simulation' },
  { path: '/issues',     icon: AlertTriangle,   label: 'Issues' },
  { path: '/reports',    icon: FileText,        label: 'Reports' },
  { path: '/archive',    icon: Archive,         label: 'Archive' },
  { path: '/settings',   icon: Settings,        label: 'Settings' },
  { path: '/about',      icon: Info,            label: 'About' },
];

export default function Sidebar() {
  return (
    <aside className="w-[68px] h-full bg-nerve-surface border-r border-nerve-border flex flex-col items-center py-4 gap-1 z-50 shrink-0">
      {/* Logo */}
      <div
        className="w-11 h-11 rounded-xl bg-nerve-red flex items-center justify-center mb-4 shadow-lg shrink-0"
        style={{ boxShadow: '0 0 20px rgba(229,25,58,0.35)' }}
      >
        <span className="text-white font-black text-[11px] tracking-tight">CN</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col gap-1 w-full px-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              `group relative w-full h-11 rounded-xl flex items-center justify-center transition-all duration-200 ${
                isActive
                  ? 'bg-nerve-red text-white shadow-lg'
                  : 'text-nerve-dim hover:text-nerve-text hover:bg-nerve-card'
              }`
            }
            style={({ isActive }) =>
              isActive ? { boxShadow: '0 0 14px rgba(229,25,58,0.3)' } : {}
            }
            title={item.label}
          >
            <item.icon size={18} strokeWidth={2} />
            {/* Tooltip on hover */}
            <div className="absolute left-full ml-2.5 px-2.5 py-1.5 bg-nerve-card border border-nerve-border rounded-lg text-xs text-nerve-text font-medium opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-lg">
              {item.label}
            </div>
          </NavLink>
        ))}
      </nav>

      {/* Connection dot */}
      <div className="mt-auto mb-1">
        <div className="w-3 h-3 rounded-full bg-nerve-green animate-pulse-green" title="Connected" />
      </div>
    </aside>
  );
}
