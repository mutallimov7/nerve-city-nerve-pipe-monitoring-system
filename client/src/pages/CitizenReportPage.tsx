import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { submitReport, trackReport } from '../services/api';
import { MapPin, Send, Search, CheckCircle, AlertTriangle } from 'lucide-react';

const CATEGORIES = ['Flooding / Subasma','Visible water leakage reported by citizen','Sewer/manhole problem','Road/asphalt damage','Utility repair not completed','Street lighting issue','Cleanliness issue','Tree/weather damage','Other'];
const URGENCIES = ['LOW','MEDIUM','HIGH','CRITICAL'];

const urgencyColor: Record<string,string> = { CRITICAL:'#e5193a', HIGH:'#f97316', MEDIUM:'#eab308', LOW:'#22c55e' };

export default function CitizenReportPage() {
  const [form, setForm] = useState({ category: '', description: '', address: '', urgency: 'MEDIUM', latitude: '', longitude: '' });
  const [submitted, setSubmitted] = useState<any>(null);
  const [trackCode, setTrackCode] = useState('');
  const [trackResult, setTrackResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<'submit' | 'track'>('submit');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await submitReport({
        ...form,
        latitude: form.latitude ? parseFloat(form.latitude) : null,
        longitude: form.longitude ? parseFloat(form.longitude) : null,
      });
      setSubmitted(result);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await trackReport(trackCode.trim().toUpperCase());
      setTrackResult(result);
    } catch {
      setTrackResult(null);
    }
  };


  return (
    <div className="page-content overflow-y-auto">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-nerve-text">Citizen Reports</h1>
          <p className="text-sm text-nerve-muted mt-1">Report municipal infrastructure problems to the city management system</p>
        </div>

        {/* Tab toggle */}
        <div className="flex gap-1 p-1 bg-nerve-card border border-nerve-border rounded-xl mb-6">
          {(['submit','track'] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${tab === t ? 'bg-nerve-red text-white' : 'text-nerve-muted hover:text-nerve-text'}`}>
              {t === 'submit' ? 'Submit Report' : 'Track Report'}
            </button>
          ))}
        </div>

        {tab === 'submit' && !submitted && (
          <motion.form initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} onSubmit={handleSubmit} className="glass-card p-6 flex flex-col gap-4">
            <div>
              <label className="text-xs font-semibold text-nerve-muted mb-1.5 block uppercase tracking-wider">Category *</label>
              <select required value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                className="w-full bg-nerve-card border border-nerve-border rounded-xl px-3 py-2.5 text-sm text-nerve-text focus:outline-none focus:border-nerve-red/50">
                <option value="">Select a category...</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-nerve-muted mb-1.5 block uppercase tracking-wider">Description *</label>
              <textarea required rows={4} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                placeholder="Describe the problem in detail..."
                className="w-full bg-nerve-card border border-nerve-border rounded-xl px-3 py-2.5 text-sm text-nerve-text placeholder:text-nerve-dim resize-none focus:outline-none focus:border-nerve-red/50" />
            </div>

            <div>
              <label className="text-xs font-semibold text-nerve-muted mb-1.5 block uppercase tracking-wider">Address / Location</label>
              <div className="relative">
                <MapPin size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-nerve-dim" />
                <input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })}
                  placeholder="Street address, landmark..."
                  className="w-full bg-nerve-card border border-nerve-border rounded-xl pl-9 pr-3 py-2.5 text-sm text-nerve-text placeholder:text-nerve-dim focus:outline-none focus:border-nerve-red/50" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-nerve-muted mb-1.5 block uppercase tracking-wider">Latitude (optional)</label>
                <input type="number" step="any" value={form.latitude} onChange={e => setForm({ ...form, latitude: e.target.value })}
                  placeholder="40.4155"
                  className="w-full bg-nerve-card border border-nerve-border rounded-xl px-3 py-2.5 text-sm text-nerve-text placeholder:text-nerve-dim focus:outline-none focus:border-nerve-red/50" />
              </div>
              <div>
                <label className="text-xs font-semibold text-nerve-muted mb-1.5 block uppercase tracking-wider">Longitude (optional)</label>
                <input type="number" step="any" value={form.longitude} onChange={e => setForm({ ...form, longitude: e.target.value })}
                  placeholder="49.8582"
                  className="w-full bg-nerve-card border border-nerve-border rounded-xl px-3 py-2.5 text-sm text-nerve-text placeholder:text-nerve-dim focus:outline-none focus:border-nerve-red/50" />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-nerve-muted mb-1.5 block uppercase tracking-wider">Urgency Level</label>
              <div className="flex gap-2">
                {URGENCIES.map(u => (
                  <button key={u} type="button" onClick={() => setForm({ ...form, urgency: u })}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${form.urgency === u ? 'text-white' : 'text-nerve-dim border-nerve-border hover:border-nerve-dim'}`}
                    style={form.urgency === u ? { background: urgencyColor[u], borderColor: urgencyColor[u] } : {}}>
                    {u}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-nerve-blue/5 border border-nerve-blue/20">
              <p className="text-xs text-nerve-muted">📷 Photo upload will be available in the next version. Please describe the problem in detail.</p>
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl bg-nerve-red text-white font-semibold text-sm flex items-center justify-center gap-2 hover:bg-nerve-red-dark transition-colors disabled:opacity-60"
              style={{ boxShadow: '0 0 20px rgba(229,25,58,0.3)' }}>
              {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Send size={14} /> Submit Report</>}
            </button>
          </motion.form>
        )}

        {tab === 'submit' && submitted && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card p-8 text-center">
            <div className="w-14 h-14 rounded-full bg-nerve-green/10 border border-nerve-green/30 flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={28} className="text-nerve-green" />
            </div>
            <h2 className="text-lg font-bold text-nerve-text mb-2">Report Submitted!</h2>
            <p className="text-sm text-nerve-muted mb-4">Your report has been received and will be reviewed by the relevant department.</p>
            <div className="p-4 rounded-xl bg-nerve-card border border-nerve-border mb-4">
              <p className="text-xs text-nerve-dim mb-1">Your Tracking Code</p>
              <p className="text-xl font-bold font-mono text-nerve-red">{submitted.trackingCode}</p>
              <p className="text-xs text-nerve-dim mt-1">Use this code to track your report status</p>
            </div>
            <button onClick={() => { setSubmitted(null); setForm({ category:'', description:'', address:'', urgency:'MEDIUM', latitude:'', longitude:'' }); }}
              className="px-6 py-2 rounded-xl border border-nerve-border text-sm text-nerve-muted hover:text-nerve-text transition-colors">
              Submit Another Report
            </button>
          </motion.div>
        )}

        {tab === 'track' && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-4">
            <form onSubmit={handleTrack} className="glass-card p-6 flex flex-col gap-4">
              <label className="text-xs font-semibold text-nerve-muted uppercase tracking-wider">Enter Tracking Code</label>
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-nerve-dim" />
                <input value={trackCode} onChange={e => setTrackCode(e.target.value)} placeholder="NRV-XXXXXXXX"
                  className="w-full bg-nerve-card border border-nerve-border rounded-xl pl-9 pr-3 py-2.5 text-sm text-nerve-text placeholder:text-nerve-dim focus:outline-none focus:border-nerve-red/50 font-mono" />
              </div>
              <button type="submit" className="w-full py-2.5 rounded-xl bg-nerve-card border border-nerve-border text-sm text-nerve-muted hover:text-nerve-text hover:border-nerve-red/40 transition-all flex items-center justify-center gap-2">
                <Search size={13} /> Track Report
              </button>
            </form>
            {trackResult && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5 flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-nerve-text font-mono">{trackResult.trackingCode}</span>
                  <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-nerve-card border border-nerve-border text-nerve-muted">{trackResult.status}</span>
                </div>
                <p className="text-xs font-semibold text-nerve-text">{trackResult.category}</p>
                <p className="text-xs text-nerve-muted">{trackResult.description}</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div><span className="text-nerve-dim">Submitted: </span><span className="text-nerve-text">{new Date(trackResult.createdAt).toLocaleDateString()}</span></div>
                  <div><span className="text-nerve-dim">Urgency: </span><span style={{ color: urgencyColor[trackResult.urgency] }} className="font-semibold">{trackResult.urgency}</span></div>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
