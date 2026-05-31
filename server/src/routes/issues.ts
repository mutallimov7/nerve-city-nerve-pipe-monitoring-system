import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';
import { emitIssueUpdate } from '../socket/socketHandler';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  let issues = db.get('issues').value();
  const { status, priority, source, search } = req.query;
  if (status) issues = issues.filter((i: any) => i.status === status);
  else issues = issues.filter((i: any) => !['Resolved','Rejected','Archived'].includes(i.status));
  if (priority) issues = issues.filter((i: any) => i.priority === priority);
  if (source) issues = issues.filter((i: any) => i.source === source);
  if (search) { const s = (search as string).toLowerCase(); issues = issues.filter((i: any) => i.title.toLowerCase().includes(s) || i.description.toLowerCase().includes(s) || i.locationName.toLowerCase().includes(s)); }
  res.json({ success: true, issues: issues.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) });
});

router.get('/:issueId', (req: Request, res: Response) => {
  const issue = db.get('issues').find({ issueId: req.params.issueId }).value();
  if (!issue) return res.status(404).json({ success: false, error: 'Issue not found' });
  res.json({ success: true, issue });
});

router.post('/:issueId/assign', (req: Request, res: Response) => {
  const issue = db.get('issues').find({ issueId: req.params.issueId }).value();
  if (!issue) return res.status(404).json({ success: false, error: 'Issue not found' });
  const { assignedDepartment, assignedPerson, by } = req.body;
  db.get('issues').find({ issueId: req.params.issueId }).assign({
    assignedDepartment: assignedDepartment || '', assignedPerson: assignedPerson || '',
    status: 'Assigned', updatedAt: new Date().toISOString(),
    auditLog: [...issue.auditLog, { action: 'Assigned', by: by || 'Admin', timestamp: new Date().toISOString(), detail: `Assigned to ${assignedDepartment} — ${assignedPerson}` }],
  }).write();
  const updated = db.get('issues').find({ issueId: req.params.issueId }).value();
  emitIssueUpdate(updated);
  res.json({ success: true, issue: updated });
});

router.post('/:issueId/status', (req: Request, res: Response) => {
  const issue = db.get('issues').find({ issueId: req.params.issueId }).value();
  if (!issue) return res.status(404).json({ success: false, error: 'Issue not found' });
  const { status, by } = req.body;
  db.get('issues').find({ issueId: req.params.issueId }).assign({
    status, updatedAt: new Date().toISOString(),
    auditLog: [...issue.auditLog, { action: 'Status Changed', by: by || 'Admin', timestamp: new Date().toISOString(), detail: `Status changed to ${status}` }],
  }).write();
  const updated = db.get('issues').find({ issueId: req.params.issueId }).value();
  emitIssueUpdate(updated);
  res.json({ success: true, issue: updated });
});

router.post('/:issueId/comment', (req: Request, res: Response) => {
  const issue = db.get('issues').find({ issueId: req.params.issueId }).value();
  if (!issue) return res.status(404).json({ success: false, error: 'Issue not found' });
  const { note, by } = req.body;
  if (!note) return res.status(400).json({ success: false, error: 'Note required' });
  db.get('issues').find({ issueId: req.params.issueId }).assign({
    notes: [...issue.notes, `[${new Date().toLocaleString()}] ${by || 'Admin'}: ${note}`],
    updatedAt: new Date().toISOString(),
    auditLog: [...issue.auditLog, { action: 'Comment Added', by: by || 'Admin', timestamp: new Date().toISOString(), detail: note }],
  }).write();
  const updated = db.get('issues').find({ issueId: req.params.issueId }).value();
  emitIssueUpdate(updated);
  res.json({ success: true, issue: updated });
});

router.post('/', (req: Request, res: Response) => {
  const issue = {
    issueId: uuidv4(), source: 'admin', linkedDeviceId: req.body.linkedDeviceId || null,
    category: req.body.category || 'General', title: req.body.title || 'New Issue',
    description: req.body.description || '', locationName: req.body.locationName || '',
    latitude: req.body.latitude || 40.4155, longitude: req.body.longitude || 49.8582,
    priority: req.body.priority || 'MEDIUM', status: 'New',
    assignedDepartment: '', assignedPerson: '', deadline: req.body.deadline || null,
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    notes: [], auditLog: [{ action: 'Created', by: 'Admin', timestamp: new Date().toISOString(), detail: 'Manually created' }],
  };
  db.get('issues').push(issue).write();
  emitIssueUpdate(issue);
  res.json({ success: true, issue });
});

export default router;
