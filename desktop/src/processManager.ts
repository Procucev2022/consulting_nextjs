import { spawn, ChildProcess, execSync } from 'child_process';
import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';

export interface ProcessManagerOptions {
  projectRoot: string;
  isPackaged?: boolean;
  resourcesPath?: string;
  execPath?: string;
}

export class ProcessManager {
  private backendProcess: ChildProcess | null = null;
  private frontendProcess: ChildProcess | null = null;
  private projectRoot: string;
  private isPackaged: boolean;
  private resourcesPath: string;
  private execPath: string;
  private logFilePath: string;

  constructor(optionsOrProjectRoot: string | ProcessManagerOptions) {
    if (typeof optionsOrProjectRoot === 'string') {
      this.projectRoot = optionsOrProjectRoot;
      this.isPackaged = false;
      this.resourcesPath = optionsOrProjectRoot;
      this.execPath = process.execPath;
    } else {
      this.projectRoot = optionsOrProjectRoot.projectRoot;
      this.isPackaged = optionsOrProjectRoot.isPackaged ?? false;
      this.resourcesPath = optionsOrProjectRoot.resourcesPath || (process.resourcesPath || optionsOrProjectRoot.projectRoot);
      this.execPath = optionsOrProjectRoot.execPath || process.execPath;
    }

    // Log paths
    const localLogsDir = path.join(this.projectRoot, 'logs');
    if (!fs.existsSync(localLogsDir)) {
      try { fs.mkdirSync(localLogsDir, { recursive: true }); } catch { /* ignore */ }
    }
    this.logFilePath = path.join(localLogsDir, 'desktop.log');

    // Ensure AppData logs dir
    const appDataDir = process.env.APPDATA
      ? path.join(process.env.APPDATA, 'aiCEV', 'logs')
      : localLogsDir;
    if (!fs.existsSync(appDataDir)) {
      try { fs.mkdirSync(appDataDir, { recursive: true }); } catch { /* ignore */ }
    }

    this.log('INFO', 'ProcessManager initialized', {
      projectRoot: this.projectRoot,
      isPackaged: this.isPackaged,
      resourcesPath: this.resourcesPath,
      execPath: this.execPath
    });
  }

  public log(level: string, message: string, context?: Record<string, unknown>): void {
    const entry = JSON.stringify({
      timestamp: new Date().toISOString(),
      level,
      service: 'aicev-desktop',
      message,
      context
    }) + '\n';

    try {
      fs.appendFileSync(this.logFilePath, entry, 'utf8');
      if (process.env.APPDATA) {
        const appDataLog = path.join(process.env.APPDATA, 'aiCEV', 'logs', 'desktop.log');
        fs.appendFileSync(appDataLog, entry, 'utf8');
      }
    } catch {
      // ignore logging write error
    }
  }

  public async checkUrl(url: string, timeoutMs: number = 2000): Promise<boolean> {
    return new Promise((resolve) => {
      const req = http.get(url, { timeout: timeoutMs }, (res) => {
        resolve(res.statusCode === 200);
      });
      req.on('error', () => resolve(false));
      req.on('timeout', () => {
        req.destroy();
        resolve(false);
      });
    });
  }

  public async waitForService(
    url: string,
    name: string,
    maxWaitMs: number = 30000,
    intervalMs: number = 500
  ): Promise<boolean> {
    const startTime = Date.now();
    this.log('INFO', `Waiting for service readiness: ${name}`, { url, maxWaitMs });

    while (Date.now() - startTime < maxWaitMs) {
      const isReady = await this.checkUrl(url);
      if (isReady) {
        const durationMs = Date.now() - startTime;
        this.log('INFO', `Service ready: ${name}`, { url, durationMs });
        return true;
      }
      await new Promise((r) => setTimeout(r, intervalMs));
    }

    this.log('ERROR', `Service failed to become ready within timeout: ${name}`, { url, maxWaitMs });
    return false;
  }

  public async startBackend(): Promise<boolean> {
    // Check if backend already running
    const alreadyRunning = await this.checkUrl('http://localhost:5000/api/health');
    if (alreadyRunning) {
      this.log('INFO', 'Backend already running on port 5000, reusing existing instance');
      return true;
    }

    this.log('INFO', 'Starting local backend server on port 5000', { isPackaged: this.isPackaged });

    const env: NodeJS.ProcessEnv = {
      ...process.env,
      PORT: '5000',
      NODE_ENV: 'production',
      APP_OPERATING_MODE: 'INTERNAL_ASSESSMENT',
      FRONTEND_URL: 'http://localhost:3001'
    };

    if (this.isPackaged) {
      const packagedBackendDir = path.join(this.resourcesPath, 'backend');
      const distServer = path.join(packagedBackendDir, 'dist', 'server.js');

      this.log('INFO', 'Spawning packaged backend via Electron Node runtime', {
        backendDir: packagedBackendDir,
        entry: distServer
      });

      this.backendProcess = spawn(this.execPath, ['dist/server.js'], {
        cwd: packagedBackendDir,
        env: {
          ...env,
          ELECTRON_RUN_AS_NODE: '1'
        },
        stdio: ['ignore', 'pipe', 'pipe'],
        detached: false
      });
    } else {
      const devBackendCwd = path.join(this.projectRoot, 'backend');
      const distServer = path.join(devBackendCwd, 'dist', 'server.js');
      const useDist = fs.existsSync(distServer);

      this.log('INFO', 'Spawning development backend', { devBackendCwd, useDist });

      if (useDist) {
        this.backendProcess = spawn('node', [distServer], {
          cwd: devBackendCwd,
          env,
          stdio: ['ignore', 'pipe', 'pipe'],
          detached: false
        });
      } else {
        this.backendProcess = spawn('npx', ['tsx', 'src/server.ts'], {
          cwd: devBackendCwd,
          env,
          stdio: ['ignore', 'pipe', 'pipe'],
          shell: true,
          detached: false
        });
      }
    }

    this.backendProcess.stdout?.on('data', (d: Buffer) => {
      const text = d.toString();
      if (text.includes('error') || text.includes('Error')) {
        this.log('WARN', `Backend stdout: ${text.trim().substring(0, 200)}`);
      }
    });

    this.backendProcess.stderr?.on('data', (d: Buffer) => {
      this.log('WARN', `Backend stderr: ${d.toString().trim().substring(0, 200)}`);
    });

    this.backendProcess.on('exit', (code, signal) => {
      this.log('INFO', 'Backend process exited', { code, signal });
      this.backendProcess = null;
    });

    return this.waitForService('http://localhost:5000/api/health', 'Backend API', 30000);
  }

  public async startFrontend(): Promise<boolean> {
    const alreadyRunning = await this.checkUrl('http://localhost:3001');
    if (alreadyRunning) {
      this.log('INFO', 'Frontend already running on port 3001, reusing existing instance');
      return true;
    }

    this.log('INFO', 'Starting local frontend Next.js server on port 3001', { isPackaged: this.isPackaged });

    const env: NodeJS.ProcessEnv = {
      ...process.env,
      PORT: '3001',
      NODE_ENV: 'production',
      APP_OPERATING_MODE: 'INTERNAL_ASSESSMENT'
    };

    if (this.isPackaged) {
      const packagedFrontendDir = path.join(this.resourcesPath, 'frontend');
      const serverJs = path.join(packagedFrontendDir, 'server.js');

      this.log('INFO', 'Spawning packaged frontend standalone server via Electron Node runtime', {
        frontendDir: packagedFrontendDir,
        entry: serverJs
      });

      this.frontendProcess = spawn(this.execPath, ['server.js'], {
        cwd: packagedFrontendDir,
        env: {
          ...env,
          ELECTRON_RUN_AS_NODE: '1'
        },
        stdio: ['ignore', 'pipe', 'pipe'],
        detached: false
      });
    } else {
      const devFrontendCwd = path.join(this.projectRoot, 'frontend');
      this.log('INFO', 'Spawning development frontend Next.js server', { devFrontendCwd });

      this.frontendProcess = spawn('npx', ['next', 'start', '-p', '3001'], {
        cwd: devFrontendCwd,
        env,
        stdio: ['ignore', 'pipe', 'pipe'],
        shell: true,
        detached: false
      });
    }

    this.frontendProcess.stdout?.on('data', (d: Buffer) => {
      const text = d.toString();
      if (text.includes('error') || text.includes('Error')) {
        this.log('WARN', `Frontend stdout: ${text.trim().substring(0, 200)}`);
      }
    });

    this.frontendProcess.stderr?.on('data', (d: Buffer) => {
      this.log('WARN', `Frontend stderr: ${d.toString().trim().substring(0, 200)}`);
    });

    this.frontendProcess.on('exit', (code, signal) => {
      this.log('INFO', 'Frontend process exited', { code, signal });
      this.frontendProcess = null;
    });

    return this.waitForService('http://localhost:3001', 'Frontend Next.js', 45000);
  }

  public stopAll(): void {
    this.log('INFO', 'Gracefully stopping desktop child processes');

    if (this.backendProcess?.pid) {
      try {
        if (process.platform === 'win32') {
          execSync(`taskkill /pid ${this.backendProcess.pid} /t /f`, { stdio: 'ignore' });
        } else {
          this.backendProcess.kill('SIGTERM');
        }
      } catch {
        // process may have already exited
      }
      this.backendProcess = null;
    }

    if (this.frontendProcess?.pid) {
      try {
        if (process.platform === 'win32') {
          execSync(`taskkill /pid ${this.frontendProcess.pid} /t /f`, { stdio: 'ignore' });
        } else {
          this.frontendProcess.kill('SIGTERM');
        }
      } catch {
        // process may have already exited
      }
      this.frontendProcess = null;
    }

    this.log('INFO', 'All desktop child processes terminated cleanly');
  }
}
