import { app, BrowserWindow, Tray, Menu, ipcMain, nativeImage } from 'electron';
import { autoUpdater } from 'electron-updater';
import path from 'path';
import { MockTelemetryProvider } from '../adapters/telemetry-mock/mock-telemetry-provider.js';
import { IRacingTelemetryProvider } from '../adapters/telemetry-iracing/iracing-telemetry-provider.js';
import { composeRevStrip } from '../application/use-cases/compose-rev-strip.js';
import { composeRibbon } from '../application/use-cases/compose-ribbon.js';
import { resolveProfile } from '../domain/telemetry/car-profiles.js';
import type { TelemetryProvider } from '../application/ports/telemetry-provider.js';

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let telemetryProvider: TelemetryProvider;
let refreshInterval: ReturnType<typeof setInterval> | null = null;

const useMock = ['1', 'true', 'yes'].includes((process.env.PRECISIONDASH_USE_MOCK ?? '').toLowerCase());

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 960,
    height: 150,
    x: 80,
    y: 40,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    hasShadow: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Click-through when not hovering interactive elements
  mainWindow.setIgnoreMouseEvents(true, { forward: true });

  const rendererPath = path.join(__dirname, '..', 'renderer', 'index.html');
  mainWindow.loadFile(rendererPath);

  mainWindow.on('closed', () => { mainWindow = null; });
}

function createTray() {
  const icon = nativeImage.createEmpty();
  tray = new Tray(icon);
  tray.setToolTip('PrecisionDash');

  const contextMenu = Menu.buildFromTemplate([
    { label: 'Show Overlay', click: () => mainWindow?.show() },
    { label: 'Hide Overlay', click: () => mainWindow?.hide() },
    { type: 'separator' },
    { label: 'Check for Updates', click: () => autoUpdater.checkForUpdatesAndNotify() },
    { type: 'separator' },
    { label: 'Exit', click: () => app.quit() },
  ]);

  tray.setContextMenu(contextMenu);
  tray.on('double-click', () => { mainWindow?.show(); mainWindow?.focus(); });
}

function startTelemetryLoop() {
  refreshInterval = setInterval(() => {
    const snapshot = telemetryProvider.tryReadSnapshot();
    if (!snapshot) {
      mainWindow?.webContents.send('telemetry:waiting', useMock ? 'Mock telemetry starting.' : 'Waiting for iRacing telemetry.');
      return;
    }
    const profile = resolveProfile(snapshot.driverCarId);
    const revStrip = composeRevStrip(snapshot, profile);
    const ribbon = composeRibbon(snapshot);
    mainWindow?.webContents.send('telemetry:update', { snapshot, revStrip, ribbon, useMock });
  }, 16);
}

app.whenReady().then(async () => {
  telemetryProvider = useMock ? new MockTelemetryProvider() : new IRacingTelemetryProvider();
  await telemetryProvider.start();

  createWindow();
  createTray();
  startTelemetryLoop();

  // Auto-update: check after 10s delay, non-blocking
  setTimeout(() => {
    autoUpdater.checkForUpdatesAndNotify().catch(() => {});
  }, 10_000);
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });

app.on('before-quit', async () => {
  if (refreshInterval) clearInterval(refreshInterval);
  await telemetryProvider?.stop();
});

// Allow renderer to toggle mouse events
ipcMain.on('set-ignore-mouse', (_event, ignore: boolean) => {
  mainWindow?.setIgnoreMouseEvents(ignore, { forward: true });
});
