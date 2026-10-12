import { app, BrowserWindow, ipcMain } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import { ProcessManager } from './processManager';
import { DesktopUpdater } from './updater';

let mainWindow: BrowserWindow | null = null;

const projectRoot = app.isPackaged
  ? process.resourcesPath
  : path.resolve(__dirname, '..', '..');

const processManager = new ProcessManager({
  projectRoot,
  isPackaged: app.isPackaged,
  resourcesPath: process.resourcesPath,
  execPath: process.execPath
});

function getPackagedReleaseIdentity(): { version: string; build: string } {
  try {
    const manifestPath = path.join(__dirname, '..', 'release-manifest.json');
    if (fs.existsSync(manifestPath)) {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      return {
        version: manifest.appVersion || manifest.version || '1.0.2',
        build: manifest.buildNumber || manifest.buildIdentifier || 'E2E-003-CERTIFIED'
      };
    }
  } catch {
    // fallback
  }
  return { version: '1.0.2', build: 'E2E-003-CERTIFIED' };
}

const releaseIdentity = getPackagedReleaseIdentity();

const desktopUpdater = new DesktopUpdater({
  projectRoot,
  currentVersion: releaseIdentity.version,
  currentBuildNumber: releaseIdentity.build,
  processManager
});

const isSingleInstance = app.requestSingleInstanceLock();
if (!isSingleInstance) {
  processManager.log('WARN', 'Second instance of aiCEV attempted, quitting second instance');
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

async function startServicesAndLoadApp(): Promise<void> {
  try {
    processManager.log('INFO', 'Initializing application services');

    const backendReady = await processManager.startBackend();
    if (!backendReady) {
      throw new Error('Backend failed to start or pass health check on port 5000');
    }

    const frontendReady = await processManager.startFrontend();
    if (!frontendReady) {
      throw new Error('Frontend failed to start on port 3001');
    }

    processManager.log('INFO', 'All services verified. Loading internal workspace in native window.');
    if (mainWindow && !mainWindow.isDestroyed()) {
      await mainWindow.loadURL('http://localhost:3001');
      mainWindow.setTitle('aiCEV – Internal Assessment');

      // Check for certified desktop updates at startup
      try {
        const updateStatus = desktopUpdater.checkStagedUpdate();
        if (updateStatus.isUpdateAvailable) {
          processManager.log('INFO', 'Pushing update available notification to renderer', {
            version: updateStatus.availableVersion,
            build: updateStatus.availableBuildNumber
          });
          mainWindow.webContents.send('aicev:update-available', updateStatus);
        }
      } catch (checkErr: unknown) {
        processManager.log('WARN', 'Startup update check non-fatal error', {
          error: checkErr instanceof Error ? checkErr.message : String(checkErr)
        });
      }
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    processManager.log('ERROR', 'Startup error in native shell', { error: errorMsg });

    if (mainWindow && !mainWindow.isDestroyed()) {
      const errorHtmlPath = path.join(__dirname, '..', 'assets', 'error.html');
      await mainWindow.loadFile(errorHtmlPath);
      mainWindow.setTitle('aiCEV – Service Startup Error');
    }
  }
}

async function createWindow(): Promise<void> {
  const iconPath = path.join(__dirname, '..', 'assets', 'aicev-icon.ico');

  mainWindow = new BrowserWindow({
    title: 'aiCEV – Internal Assessment',
    width: 1440,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    icon: iconPath,
    autoHideMenuBar: true,
    show: false,
    backgroundColor: '#0f172a',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true
    }
  });

  mainWindow.removeMenu();

  // WebContents event logging and telemetry
  mainWindow.webContents.on('did-finish-load', () => {
    processManager.log('INFO', 'Window finished loading content', {
      url: mainWindow?.webContents.getURL()
    });

    // Check for certified desktop updates upon page load completion
    try {
      const updateStatus = desktopUpdater.checkStagedUpdate();
      if (updateStatus.isUpdateAvailable) {
        processManager.log('INFO', 'Pushing update available notification on did-finish-load', {
          version: updateStatus.availableVersion,
          build: updateStatus.availableBuildNumber
        });
        mainWindow?.webContents.send('aicev:update-available', updateStatus);
      }
    } catch (checkErr: unknown) {
      processManager.log('WARN', 'Update check on did-finish-load non-fatal error', {
        error: checkErr instanceof Error ? checkErr.message : String(checkErr)
      });
    }
  });

  mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL) => {
    processManager.log('ERROR', 'Window failed to load target', {
      errorCode,
      errorDescription,
      validatedURL
    });
  });

  mainWindow.webContents.on('render-process-gone', (_event, details) => {
    processManager.log('ERROR', 'Render process gone', { details });
  });

  mainWindow.webContents.on('unresponsive', () => {
    processManager.log('WARN', 'Native window became unresponsive');
  });

  mainWindow.webContents.on('console-message', (_event, level, message) => {
    if (level >= 2) {
      processManager.log('DEBUG', 'Renderer console log', { level, message });
    }
  });

  // Restrict navigation to local application only
  mainWindow.webContents.on('will-navigate', (event, url) => {
    try {
      const parsed = new URL(url);
      const isLocal = (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') &&
                      (parsed.port === '3001' || parsed.port === '5000');
      if (!isLocal && !url.startsWith('file:')) {
        event.preventDefault();
        processManager.log('WARN', 'Blocked unauthorized navigation attempt', { url });
      }
    } catch {
      event.preventDefault();
    }
  });

  mainWindow.webContents.setWindowOpenHandler(() => {
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Load static splash screen first
  const splashHtmlPath = path.join(__dirname, '..', 'assets', 'splash.html');
  await mainWindow.loadFile(splashHtmlPath);
  mainWindow.show();

  // Start internal services and load workspace
  await startServicesAndLoadApp();
}

// IPC Handlers for fallback actions
ipcMain.on('aicev:retry-startup', async () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    processManager.log('INFO', 'User requested startup retry');
    const splashHtmlPath = path.join(__dirname, '..', 'assets', 'splash.html');
    await mainWindow.loadFile(splashHtmlPath);
    await startServicesAndLoadApp();
  }
});

ipcMain.on('aicev:close-app', () => {
  processManager.log('INFO', 'User requested application close');
  app.quit();
});

// IPC Handlers for desktop updates
ipcMain.handle('aicev:check-for-updates', async () => {
  processManager.log('INFO', 'Renderer requested check for updates');
  return desktopUpdater.checkStagedUpdate();
});

ipcMain.handle('aicev:install-update', async () => {
  processManager.log('INFO', 'Renderer requested update installation and restart');
  return desktopUpdater.installUpdateAndRestart();
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  processManager.log('INFO', 'Window closed by user. Terminating application.');
  processManager.stopAll();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  processManager.stopAll();
});
