import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar';
import TopBar from './components/layout/TopBar';
import { getSocket } from './socket/socket';
import { useNerveStore } from './store/useNerveStore';
import { getDashboardSummary, getDevices } from './services/api';

import DashboardPage from './pages/DashboardPage';
import MapPage from './pages/MapPage';
import DevicesPage from './pages/DevicesPage';
import DeviceDetailPage from './pages/DeviceDetailPage';
import SimulationPage from './pages/SimulationPage';
import CitizenReportPage from './pages/CitizenReportPage';
import IssuesPage from './pages/IssuesPage';
import ArchivePage from './pages/ArchivePage';
import SettingsPage from './pages/SettingsPage';
import AboutPage from './pages/AboutPage';

function SocketListener() {
  const { updateDevice, addAlert, updateIssue, setSummary, setConnected, setLastUpdate, setLiveReading } = useNerveStore();

  useEffect(() => {
    const socket = getSocket();

    socket.on('connect', () => { setConnected(true); console.log('[Socket] Connected'); });
    socket.on('disconnect', () => { setConnected(false); console.log('[Socket] Disconnected'); });

    socket.on('sensor-update', (data: any) => {
      if (data.device) updateDevice(data.device);
      if (data.reading) setLiveReading(data.reading);
      setLastUpdate(new Date());
    });

    socket.on('new-alert', (alert: any) => { addAlert(alert); setLastUpdate(new Date()); });
    socket.on('issue-update', (issue: any) => { updateIssue(issue); });
    socket.on('dashboard-update', (summary: any) => { setSummary(summary); setLastUpdate(new Date()); });

    // Initial data load
    getDashboardSummary().then(setSummary).catch(console.error);
    getDevices().then((devices) => {
      useNerveStore.getState().setDevices(devices);
      getDashboardSummary().then((s) => {
        if (s?.latestAlerts) useNerveStore.getState().setAlerts(s.latestAlerts);
      }).catch(console.error);
    }).catch(console.error);

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('sensor-update');
      socket.off('new-alert');
      socket.off('issue-update');
      socket.off('dashboard-update');
    };
  }, []);

  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <SocketListener />
      <div className="flex w-full h-screen overflow-hidden bg-nerve-bg">
        <Sidebar />
        <div className="flex flex-col flex-1 min-w-0 min-h-0 overflow-hidden">
          <TopBar />
          {/* This is the ONLY scrollable container — min-h-0 is critical for flex children */}
          <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/map" element={<MapPage />} />
              <Route path="/devices" element={<DevicesPage />} />
              <Route path="/devices/:deviceId" element={<DeviceDetailPage />} />
              <Route path="/simulation" element={<SimulationPage />} />
              <Route path="/reports" element={<CitizenReportPage />} />
              <Route path="/issues" element={<IssuesPage />} />
              <Route path="/archive" element={<ArchivePage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/about" element={<AboutPage />} />
            </Routes>
          </div>
        </div>
      </div>
    </BrowserRouter>
  );
}
