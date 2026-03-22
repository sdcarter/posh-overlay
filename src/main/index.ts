import { app, BrowserWindow, Tray, Menu, ipcMain, nativeImage, dialog, screen } from 'electron';
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
let locked = true;

const useMock = ['1', 'true', 'yes'].includes((process.env.PRECISIONDASH_USE_MOCK ?? '').toLowerCase());

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
    focusable: false,
    hasShadow: false,
    roundedCorners: false,
    backgroundColor: '#00000000',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.setAlwaysOnTop(true, 'screen-saver', 1);
  mainWindow.setIgnoreMouseEvents(true, { forward: true });
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
  // NEVER call setIgnoreMouseEvents(false) — that triggers Windows title bar chrome.
  // Always stay in pass-through mode. The renderer uses mouseenter/mouseleave on the
  // panel to temporarily flip ignore on/off only while hovering the overlay.
  mainWindow?.webContents.send('overlay:lock', locked);
  if (locked) {
    // Ensure we're back to full pass-through when locking
    mainWindow?.setIgnoreMouseEvents(true, { forward: true });
  }
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
  tray = new Tray(nativeImage.createEmpty());
  tray.setToolTip('PrecisionDash');
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
    const profile = resolveProfile(snapshot.driverCarId);
    const revStrip = composeRevStrip(snapshot, profile);
    const ribbon = composeRibbon(snapshot);
    mainWindow?.webContents.send('telemetry:update', { snapshot, revStrip, ribbon, useMock });
  }, 16);
}

function checkForUpdates() {
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = false;
  autoUpdater.checkForUpdates().catch(() => {});
}

autoUpdater.on('update-available', () => { autoUpdater.downloadUpdate().catch(() => {}); });

autoUpdater.on('update-downloaded', (info) => {
  const response = dialog.showMessageBoxSync({
    type: 'info',
    title: 'PrecisionDash Update',
    message: `Version ${info.version} is ready to install.`,
    detail: info.releaseNotes ? String(info.releaseNotes) : undefined,
    buttons: ['Restart Now', 'Later'],
    defaultId: 0,
    cancelId: 1,
  });
  if (response === 0) autoUpdater.quitAndInstall();
});

app.whenReady().then(async () => {
  telemetryProvider = useMock ? new MockTelemetryProvider() : new IRacingTelemetryProvider();
  await telemetryProvider.start();
  createWindow();
  createTray();
  startTelemetryLoop();
  setTimeout(checkForUpdates, 10_000);
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });

app.on('before-quit', async () => {
  if (refreshInterval) clearInterval(refreshInterval);
  await telemetryProvider?.stop();
});

// Renderer tells us when mouse enters/leaves the overlay panel while unlocked.
// This lets us accept clicks on the panel without ever calling setIgnoreMouseEvents(false)
// on the whole window permanently (which triggers the Windows title bar bug).
ipcMain.on('overlay:mouse-enter', () => {
  if (!locked) mainWindow?.setIgnoreMouseEvents(false);
});

ipcMain.on('overlay:mouse-leave', () => {
  mainWindow?.setIgnoreMouseEvents(true, { forward: true });
});
