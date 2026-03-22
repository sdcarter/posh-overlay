import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  onTelemetryUpdate: (callback: (data: unknown) => void) => ipcRenderer.on('telemetry:update', (_e, data) => callback(data)),
  onTelemetryWaiting: (callback: (msg: string) => void) => ipcRenderer.on('telemetry:waiting', (_e, msg) => callback(msg)),
  onLockChange: (callback: (locked: boolean) => void) => ipcRenderer.on('overlay:lock', (_e, locked) => callback(locked)),
  getLayout: () => ipcRenderer.invoke('layout:get') as Promise<{ x: number; y: number; w: number; h: number } | null>,
  saveLayout: (layout: { x: number; y: number; w: number; h: number }) => ipcRenderer.send('layout:save', layout),
});
