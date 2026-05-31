import { create } from 'zustand';

interface NerveState {
  devices: any[];
  setDevices: (devices: any[]) => void;
  updateDevice: (device: any) => void;

  summary: any;
  setSummary: (s: any) => void;

  alerts: any[];
  addAlert: (a: any) => void;
  setAlerts: (alerts: any[]) => void;

  issues: any[];
  setIssues: (issues: any[]) => void;
  updateIssue: (issue: any) => void;

  mapData: any;
  setMapData: (d: any) => void;

  connected: boolean;
  setConnected: (v: boolean) => void;

  lastUpdate: Date | null;
  setLastUpdate: (d: Date) => void;

  selectedDeviceId: string | null;
  setSelectedDeviceId: (id: string | null) => void;

  liveReading: any | null;
  setLiveReading: (r: any) => void;
}

export const useNerveStore = create<NerveState>((set) => ({
  devices: [],
  setDevices: (devices) => set({ devices }),
  updateDevice: (device) =>
    set((state) => ({
      devices: state.devices.map((d) => (d.deviceId === device.deviceId ? { ...d, ...device } : d)),
    })),

  summary: null,
  setSummary: (summary) => set({ summary }),

  alerts: [],
  addAlert: (a) => set((state) => ({ alerts: [a, ...state.alerts].slice(0, 50) })),
  setAlerts: (alerts) => set({ alerts }),

  issues: [],
  setIssues: (issues) => set({ issues }),
  updateIssue: (issue) =>
    set((state) => ({
      issues: state.issues.find((i) => i.issueId === issue.issueId)
        ? state.issues.map((i) => (i.issueId === issue.issueId ? issue : i))
        : [issue, ...state.issues],
    })),

  mapData: null,
  setMapData: (mapData) => set({ mapData }),

  connected: false,
  setConnected: (connected) => set({ connected }),

  lastUpdate: null,
  setLastUpdate: (lastUpdate) => set({ lastUpdate }),

  selectedDeviceId: null,
  setSelectedDeviceId: (selectedDeviceId) => set({ selectedDeviceId }),

  liveReading: null,
  setLiveReading: (liveReading) => set({ liveReading }),
}));
