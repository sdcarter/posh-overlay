import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  onTelemetryUpdate: (callback: (data: any) => void) => ipcRenderer.on('telemetry:update', (_e, data) => callback(data)),
  onTelemetryWaiting: (callback: (msg: string) => void) => ipcRenderer.on('telemetry:waiting', (_e, msg) => callback(msg)),
  onLockChange: (callback: (locked: boolean) => void) => ipcRenderer.on('overlay:lock', (_e, locked) => callback(locked)),
  setIgnoreMouse: (ignore: boolean) => ipcRenderer.send('set-ignore-mouse', ignore),
});
