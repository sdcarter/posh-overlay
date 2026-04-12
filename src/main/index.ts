import { app, BrowserWindow, Tray, Menu, ipcMain, nativeImage, dialog, screen } from 'electron';
import electronUpdater from 'electron-updater';
const { autoUpdater } = electronUpdater;
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { MockTelemetryProvider } from '../adapters/telemetry-mock/mock-telemetry-provider.js';
import { IRacingTelemetryProvider } from '../adapters/telemetry-iracing/iracing-telemetry-provider.js';
import { composeRevStrip } from '../application/use-cases/compose-rev-strip.js';
import { composeRibbon } from '../application/use-cases/compose-ribbon.js';
import { resolveProfile } from '../domain/telemetry/car-profiles.js';
import type { TelemetryProvider } from '../application/ports/telemetry-provider.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let telemetryProvider: TelemetryProvider;
let refreshInterval: ReturnType<typeof setInterval> | null = null;
let locked = true;

const useMock = ['1', 'true', 'yes'].includes((process.env.POSHDASH_USE_MOCK ?? '').toLowerCase());
const mockScenario = (process.env.POSHDASH_MOCK_SCENARIO ?? 'default').toLowerCase();

function layoutPath() { return path.join(app.getPath('userData'), 'overlay-layout.json'); }

function readLayout(): { x: number; y: number; w: number; h: number } | null {
  try { return JSON.parse(fs.readFileSync(layoutPath(), 'utf-8')); } catch { return null; }
}

function saveLayout(layout: { x: number; y: number; w: number; h: number }) {
  try { fs.writeFileSync(layoutPath(), JSON.stringify(layout)); } catch { /* ignore */ }
}

function createWindow() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { x, y, width, height } = primaryDisplay.bounds;

  mainWindow = new BrowserWindow({
    x, y, width, height,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    movable: false,
    focusable: true,
    hasShadow: false,
    roundedCorners: false,
    backgroundColor: '#00000000',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.setAlwaysOnTop(true, 'screen-saver', 1);
  mainWindow.setIgnoreMouseEvents(true);
  Menu.setApplicationMenu(null);

  const rendererPath = path.join(__dirname, '..', 'renderer', 'index.html');
  mainWindow.loadFile(rendererPath);

  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow?.webContents.send('overlay:lock', locked);
  });

  mainWindow.on('closed', () => { mainWindow = null; });
}

function toggleLock() {
  locked = !locked;
  mainWindow?.setIgnoreMouseEvents(locked);
  mainWindow?.webContents.send('overlay:lock', locked);
  if (!locked) mainWindow?.focus();
  rebuildTrayMenu();
}

function rebuildTrayMenu() {
  if (!tray) return;
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: 'Show Overlay', click: () => mainWindow?.show() },
    { label: 'Hide Overlay', click: () => mainWindow?.hide() },
    { type: 'separator' },
    { label: locked ? 'Unlock Overlay' : 'Lock Overlay', click: toggleLock },
    { type: 'separator' },
    { label: 'Check for Updates', click: checkForUpdates },
    { type: 'separator' },
    { label: 'Exit', click: () => app.quit() },
  ]));
}

function createTray() {
  tray = new Tray(nativeImage.createFromPath(path.join(__dirname, '..', '..', 'assets', 'tray-icon.png')));
  tray.setToolTip('PoshDash');
  rebuildTrayMenu();
  tray.on('double-click', () => { mainWindow?.show(); });
}

function startTelemetryLoop() {
  refreshInterval = setInterval(() => {
    const snapshot = telemetryProvider.tryReadSnapshot();
    if (!snapshot) {
      mainWindow?.webContents.send('telemetry:waiting', useMock ? 'Mock telemetry starting.' : 'Waiting for iRacing telemetry.');
      return;
    }
    const profile = resolveProfile(snapshot.driverCarId, snapshot.carPath, snapshot.gear, snapshot.maxRpm);
    if (!profile && snapshot.carPath) {
      console.log(`[PoshDash] Failed to resolve profile for car path: "${snapshot.carPath}"`);
    }
    const revStrip = composeRevStrip(snapshot, profile);
    const ribbon = composeRibbon(snapshot);
    mainWindow?.webContents.send('telemetry:update', { snapshot, revStrip, ribbon, useMock });
  }, 16);
}

function stripHtml(notes: unknown): string | undefined {
  if (!notes) return undefined;
  const raw = typeof notes === 'string' ? notes : Array.isArray(notes) ? notes.map((n: { note?: string | null }) => n.note ?? '').join('\n') : String(notes);
  return raw.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/\n{3,}/g, '\n\n').trim() || undefined;
}

function checkForUpdates() {
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = false;
  autoUpdater.checkForUpdates().catch(() => {});
}

autoUpdater.on('update-available', () => { autoUpdater.downloadUpdate().catch(() => {}); });

autoUpdater.on('update-downloaded', (info) => {
  // Lock overlay before showing modal so the transparent window doesn't block it
  if (!locked) toggleLock();
  const response = dialog.showMessageBoxSync({
    type: 'info',
    title: 'PoshDash Update',
    message: `Version ${info.version} is ready to install.`,
    detail: stripHtml(info.releaseNotes),
    buttons: ['Restart Now', 'Later'],
    defaultId: 0,
    cancelId: 1,
  });
  if (response === 0) autoUpdater.quitAndInstall();
});

const gotLock = app.requestSingleInstanceLock();

if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
  });

  app.whenReady().then(async () => {
    ipcMain.handle('layout:get', () => readLayout());
    ipcMain.on('layout:save', (_e, layout) => saveLayout(layout));
    telemetryProvider = useMock ? new MockTelemetryProvider(mockScenario) : new IRacingTelemetryProvider();
    await telemetryProvider.start();
    createWindow();
    createTray();
    startTelemetryLoop();
    setTimeout(checkForUpdates, 10_000);
  });
}

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });

app.on('before-quit', async () => {
  if (refreshInterval) clearInterval(refreshInterval);
  await telemetryProvider?.stop();
});
