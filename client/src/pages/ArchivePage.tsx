import React, { useEffect, useState } from 'react';
import { getArchive } from '../services/api';
import { Archive, AlertTriangle, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ArchivePage() {
  const [data, setData] = useState<{ issues: any[]; alerts: any[] }>({ issues: [], alerts: [] });
  const [tab, setTab] = useState<'issues' | 'alerts'>('issues');

  useEffect(() => { getArchive().then(setData).catch(console.error); }, []);

  return (
    <div className="page-content overflow-y-auto">
      <div className="mb-5">
        <h1 className="text-xl font-bold text-nerve-text">Archive</h1>
        <p className="text-sm text-nerve-muted">Resolved issues, closed alerts, and historical records</p>
      </div>

      <div className="flex gap-1 p-1 bg-nerve-card border border-nerve-border rounded-xl mb-4 w-fit">
        {(['issues','alerts'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${tab === t ? 'bg-nerve-red text-white' : 'text-nerve-muted hover:text-nerve-text'}`}>
            {t === 'issues' ? `Issues (${data.issues.length})` : `Alerts (${data.alerts.length})`}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        {tab === 'issues' && data.issues.map((issue, i) => (
          <motion.div key={issue.issueId} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
            className="glass-card p-4 flex items-center gap-3">
            <CheckCircle size={16} className="text-nerve-green flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-nerve-text line-clamp-1">{issue.title}</p>
              <p className="text-xs text-nerve-dim">{issue.status} · {new Date(issue.updatedAt).toLocaleDateString()}</p>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-nerve-gray/20 text-nerve-gray">{issue.priority}</span>
          </motion.div>
        ))}
        {tab === 'alerts' && data.alerts.map((alert, i) => (
          <motion.div key={alert.alertId} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
            className="glass-card p-4 flex items-center gap-3">
            <AlertTriangle size={16} className="text-nerve-dim flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-nerve-text">{alert.alertType}</p>
              <p className="text-xs text-nerve-dim">{alert.deviceId} · {new Date(alert.timestamp).toLocaleString()}</p>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-nerve-gray/20 text-nerve-gray">Resolved</span>
          </motion.div>
        ))}
        {((tab === 'issues' && data.issues.length === 0) || (tab === 'alerts' && data.alerts.length === 0)) && (
          <div className="glass-card p-8 text-center text-nerve-dim">
            <Archive size={28} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">No archived {tab} yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
