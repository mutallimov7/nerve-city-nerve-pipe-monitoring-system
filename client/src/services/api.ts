import axios from 'axios';

const BASE = 'http://localhost:5000/api';
const api = axios.create({ baseURL: BASE });

export const getDashboardSummary = () => api.get('/dashboard-summary').then(r => r.data.summary);
export const getDevices = () => api.get('/devices').then(r => r.data.devices);
export const getDevice = (id: string) => api.get(`/devices/${id}`).then(r => r.data.device);
export const getDeviceReadings = (id: string, limit = 100) => api.get(`/devices/${id}/readings?limit=${limit}`).then(r => r.data.readings);
export const setDeviceOffline = (id: string) => api.post(`/devices/${id}/offline`);
export const setDeviceOnline = (id: string) => api.post(`/devices/${id}/online`);
export const updateDevice = (id: string, data: any) => api.put(`/devices/${id}`, data);

export const getMapData = () => api.get('/map-data').then(r => r.data);

export const getIssues = (params?: any) => api.get('/issues', { params }).then(r => r.data.issues);
export const getIssue = (id: string) => api.get(`/issues/${id}`).then(r => r.data.issue);
export const assignIssue = (id: string, data: any) => api.post(`/issues/${id}/assign`, data);
export const updateIssueStatus = (id: string, data: any) => api.post(`/issues/${id}/status`, data);
export const addIssueComment = (id: string, data: any) => api.post(`/issues/${id}/comment`, data);
export const createIssue = (data: any) => api.post('/issues', data);

export const submitReport = (data: any) => api.post('/reports', data).then(r => r.data);
export const trackReport = (code: string) => api.get(`/reports/${code}`).then(r => r.data.report);
export const getReports = () => api.get('/reports').then(r => r.data.reports);

export const postSensorData = (data: any) => api.post('/sensor-data', data).then(r => r.data);
export const simulateReading = (deviceId: string, scenario: string) =>
  api.post('/simulate-reading', { deviceId, scenario }).then(r => r.data);

export const getArchive = () => api.get('/archive').then(r => r.data);
export const getSettings = () => api.get('/settings').then(r => r.data.settings);
export const updateSettings = (data: any) => api.put('/settings', data).then(r => r.data.settings);
export const getDepartments = () => api.get('/settings/departments').then(r => r.data.departments);
