import { Server as SocketIOServer } from 'socket.io';

let io: SocketIOServer | null = null;

export function initSocket(socketServer: SocketIOServer): void {
  io = socketServer;

  io.on('connection', (socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);

    socket.on('disconnect', () => {
      console.log(`[Socket] Client disconnected: ${socket.id}`);
    });
  });
}

export function getIO(): SocketIOServer {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
}

export function emitSensorUpdate(data: any) {
  if (io) io.emit('sensor-update', data);
}

export function emitNewAlert(data: any) {
  if (io) io.emit('new-alert', data);
}

export function emitIssueUpdate(data: any) {
  if (io) io.emit('issue-update', data);
}

export function emitDashboardUpdate(data: any) {
  if (io) io.emit('dashboard-update', data);
}

export function emitMapUpdate(data: any) {
  if (io) io.emit('map-update', data);
}
