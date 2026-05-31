import express from 'express';
import http from 'http';
import cors from 'cors';
import { Server as SocketIOServer } from 'socket.io';

import { initDb } from './db';
import { initSocket } from './socket/socketHandler';

import sensorDataRoutes from './routes/sensorData';
import devicesRoutes from './routes/devices';
import dashboardRoutes from './routes/dashboard';
import mapRoutes from './routes/map';
import issuesRoutes from './routes/issues';
import reportsRoutes from './routes/reports';
import archiveRoutes from './routes/archive';
import settingsRoutes from './routes/settings';

const PORT = process.env.PORT || 5000;

initDb();

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: { origin: '*', methods: ['GET','POST','PUT','DELETE'] },
});
initSocket(io);

app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/api', sensorDataRoutes);
app.use('/api/devices', devicesRoutes);
app.use('/api/dashboard-summary', dashboardRoutes);
app.use('/api/map-data', mapRoutes);
app.use('/api/issues', issuesRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/archive', archiveRoutes);
app.use('/api/settings', settingsRoutes);
app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'Nerve API', time: new Date().toISOString() }));

server.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`\n🚀 Nerve API → http://0.0.0.0:${PORT}`);
  console.log(`🔌 Socket.io ready`);
  console.log(`📡 ESP32 endpoint: POST http://YOUR_LOCAL_IP:${PORT}/api/sensor-data\n`);
});
