import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { getIssues, updateIssueStatus, assignIssue, addIssueComment, getDepartments } from '../services/api';
import { useNerveStore } from '../store/useNerveStore';
import StatusBadge from '../components/ui/StatusBadge';
import { Filter, ChevronDown, MessageSquare, User, Clock, AlertTriangle } from 'lucide-react';

const STATUSES = ['New','Under Review','Assigned','In Progress','Resolved','Rejected','Archived'];
const PRIORITIES = ['LOW','MEDIUM','HIGH','CRITICAL'];

const priorityColor: Record<string,string> = { CRITICAL:'#e5193a', HIGH:'#f97316', MEDIUM:'#eab308', LOW:'#22c55e' };

export default function IssuesPage() {
  const { issues, setIssues, updateIssue } = useNerveStore();
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [departments, setDepartments] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [comment, setComment] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [assignDept, setAssignDept] = useState('');
  const [assignPerson, setAssignPerson] = useState('');

  useEffect(() => {
    getIssues().then(setIssues).catch(console.error);
    getDepartments().then(setDepartments).catch(console.error);
  }, []);

  const filtered = issues.filter((i) => {
    if (statusFilter && i.status !== statusFilter) return false;
    if (priorityFilter && i.priority !== priorityFilter) return false;
    return true;
  });

  const handleStatusChange = async (id: string, status: string) => {
    const updated = await updateIssueStatus(id, { status }).then(r => r.data.issue);
    if (updated) { updateIssue(updated); setSelected(updated); }
  };

  const handleAssign = async () => {
    if (!selected) return;
    const updated = await assignIssue(selected.issueId, { assignedDepartment: assignDept, assignedPerson }).then(r => r.data.issue);
    if (updated) { updateIssue(updated); setSelected(updated); }
  };

  const handleComment = async () => {
    if (!selected || !comment.trim()) return;
    const updated = await addIssueComment(selected.issueId, { note: comment }).then(r => r.data.issue);
    if (updated) { updateIssue(updated); setSelected(updated); setComment(''); }
  };

  return (
    <div className="page-content overflow-y-auto">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-nerve-text">Issues</h1>
          <p className="text-sm text-nerve-muted">{issues.length} total · {issues.filter(i=>!['Resolved','Rejected','Archived'].includes(i.status)).length} active</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} className="bg-nerve-card border border-nerve-border rounded-xl px-3 py-1.5 text-xs text-nerve-text focus:outline-none focus:border-nerve-red/50">
            <option value="">All Status</option>
            {STATUSES.map(s=><option key={s} value={s}>{s}</option>)}
          </select>
          <select value={priorityFilter} onChange={e=>setPriorityFilter(e.target.value)} className="bg-nerve-card border border-nerve-border rounded-xl px-3 py-1.5 text-xs text-nerve-text focus:outline-none focus:border-nerve-red/50">
            <option value="">All Priority</option>
            {PRIORITIES.map(p=><option key={p} value={p}>{p}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Issues list */}
        <div className="lg:col-span-2 flex flex-col gap-2">
          {filtered.length === 0 && (
            <div className="glass-card p-8 text-center text-nerve-dim">
              <AlertTriangle size={28} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">No issues found</p>
            </div>
          )}
          {filtered.map((issue, i) => {
            const pc = priorityColor[issue.priority] || '#6b7280';
            return (
              <motion.div
                key={issue.issueId}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => setSelected(issue)}
                className={`glass-card glass-card-hover p-4 cursor-pointer transition-all ${selected?.issueId === issue.issueId ? 'border-nerve-red/50' : ''}`}
                style={selected?.issueId === issue.issueId ? { boxShadow: '0 0 0 1px rgba(229,25,58,0.4)' } : {}}
                whileHover={{ y: -1 }}
              >
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: pc, boxShadow: `0 0 6px ${pc}` }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-nerve-text line-clamp-1">{issue.title}</span>
                      <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded font-bold flex-shrink-0" style={{ color: pc, background: `${pc}20` }}>{issue.priority}</span>
                    </div>
                    <p className="text-xs text-nerve-muted line-clamp-2 mb-2">{issue.description}</p>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-nerve-card border border-nerve-border text-nerve-dim">{issue.status}</span>
                      <span className="text-[10px] text-nerve-dim">{issue.source}</span>
                      {issue.linkedDeviceId && <span className="text-[10px] text-nerve-dim font-mono">{issue.linkedDeviceId}</span>}
                      <span className="ml-auto text-[10px] text-nerve-dim flex items-center gap-1">
                        <Clock size={9} /> {new Date(issue.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Issue detail panel */}
        <div>
          {!selected ? (
            <div className="glass-card p-6 text-center text-nerve-dim">
              <Filter size={24} className="mx-auto mb-2 opacity-30" />
              <p className="text-xs">Select an issue to view details</p>
            </div>
          ) : (
            <motion.div key={selected.issueId} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} className="glass-card p-4 flex flex-col gap-3 sticky top-0">
              <p className="text-sm font-bold text-nerve-text line-clamp-2">{selected.title}</p>
              <p className="text-xs text-nerve-muted">{selected.description}</p>

              {/* Status change */}
              <div>
                <p className="text-[10px] text-nerve-dim mb-1 uppercase tracking-wider">Update Status</p>
                <div className="flex gap-1 flex-wrap">
                  {STATUSES.map(s => (
                    <button key={s} onClick={() => handleStatusChange(selected.issueId, s)}
                      className={`text-[10px] px-2 py-1 rounded-lg border transition-all ${selected.status === s ? 'bg-nerve-red border-nerve-red text-white' : 'border-nerve-border text-nerve-dim hover:border-nerve-red/40 hover:text-nerve-text'}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Assign */}
              <div>
                <p className="text-[10px] text-nerve-dim mb-1 uppercase tracking-wider">Assign</p>
                <select value={assignDept} onChange={e=>setAssignDept(e.target.value)} className="w-full bg-nerve-card border border-nerve-border rounded-lg px-2 py-1.5 text-xs text-nerve-text mb-1.5 focus:outline-none">
                  <option value="">Select Department</option>
                  {departments.map(d=><option key={d.departmentId} value={d.name}>{d.name}</option>)}
                </select>
                <input value={assignPerson} onChange={e=>setAssignPerson(e.target.value)} placeholder="Person name" className="w-full bg-nerve-card border border-nerve-border rounded-lg px-2 py-1.5 text-xs text-nerve-text mb-1.5 focus:outline-none" />
                <button onClick={handleAssign} className="w-full py-1.5 rounded-lg bg-nerve-card border border-nerve-border text-xs text-nerve-muted hover:border-nerve-red/40 hover:text-nerve-text transition-all flex items-center justify-center gap-1.5">
                  <User size={11} /> Assign
                </button>
                {selected.assignedDepartment && <p className="text-[10px] text-nerve-green mt-1">→ {selected.assignedDepartment} / {selected.assignedPerson}</p>}
              </div>

              {/* Comment */}
              <div>
                <p className="text-[10px] text-nerve-dim mb-1 uppercase tracking-wider">Add Comment</p>
                <textarea value={comment} onChange={e=>setComment(e.target.value)} rows={2} placeholder="Add note..." className="w-full bg-nerve-card border border-nerve-border rounded-lg px-2 py-1.5 text-xs text-nerve-text resize-none focus:outline-none mb-1.5" />
                <button onClick={handleComment} className="w-full py-1.5 rounded-lg bg-nerve-card border border-nerve-border text-xs text-nerve-muted hover:border-nerve-red/40 hover:text-nerve-text transition-all flex items-center justify-center gap-1.5">
                  <MessageSquare size={11} /> Add Comment
                </button>
              </div>

              {/* Audit log */}
              {selected.auditLog?.length > 0 && (
                <div>
                  <p className="text-[10px] text-nerve-dim mb-1.5 uppercase tracking-wider">Audit Log</p>
                  <div className="max-h-40 overflow-y-auto flex flex-col gap-1">
                    {[...selected.auditLog].reverse().map((entry: any, i: number) => (
                      <div key={i} className="p-2 rounded-lg bg-nerve-card border border-nerve-border/50">
                        <p className="text-[10px] font-semibold text-nerve-text">{entry.action}</p>
                        <p className="text-[10px] text-nerve-dim">{entry.by} · {new Date(entry.timestamp).toLocaleString()}</p>
                        {entry.detail && <p className="text-[10px] text-nerve-muted mt-0.5">{entry.detail}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
