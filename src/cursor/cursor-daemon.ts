/**
 * Cursor Daemon Manager
 *
 * Manages the cursor daemon lifecycle (start/stop/status).
 * Uses CursorExecutor for OpenAI-compatible API proxy to Cursor backend.
 */

import { spawn, spawnSync, ChildProcess } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as http from 'http';
import type { CursorDaemonConfig, CursorDaemonStatus } from './types';
import { getCcsDir } from '../utils/config-manager';

/**
 * Get Cursor directory path.
 */
function getCursorDir(): string {
  return path.join(getCcsDir(), 'cursor');
}

/**
 * Get PID file path.
 * Computed at runtime to respect CCS_HOME changes (e.g., in tests).
 */
function getPidFilePath(): string {
  return path.join(getCursorDir(), 'daemon.pid');
}

/**
 * Resolve daemon entrypoint candidates for current runtime.
 * - Dist runtime always uses JS artifact.
 * - Bun source runtime prefers TS, then falls back to JS.
 */
function getDaemonEntrypointCandidates(): string[] {
  const jsEntry = path.join(__dirname, 'cursor-daemon-entry.js');
  const tsEntry = path.join(__dirname, 'cursor-daemon-entry.ts');
  const isBunRuntime = process.execPath.toLowerCase().includes('bun');
  const runningFromDist = __filename.endsWith('.js');

  if (runningFromDist) {
    return [jsEntry];
  }

  if (isBunRuntime) {
    return [tsEntry, jsEntry];
  }

  return [jsEntry];
}

async function resolveDaemonEntrypoint(): Promise<string | null> {
  for (const candidate of getDaemonEntrypointCandidates()) {
    try {
      await fs.promises.access(candidate, fs.constants.R_OK);
      return candidate;
    } catch {
      // Try next candidate
    }
  }

  return null;
}

/**
 * Check if cursor daemon is running on the specified port.
 * Uses 127.0.0.1 instead of localhost for more reliable local connections.
 */
export async function isDaemonRunning(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port,
        path: '/health',
        method: 'GET',
        timeout: 3000,
      },
      (res) => {
        let body = '';
        res.setEncoding('utf8');

        res.on('data', (chunk) => {
          body += chunk;
        });

        res.on('end', () => {
          if (res.statusCode !== 200) {
            resolve(false);
            return;
          }

          try {
            const payload = JSON.parse(body) as { service?: string };
            resolve(payload.service === 'cursor-daemon');
          } catch {
            resolve(false);
          }
        });
      }
    );

    req.on('error', () => {
      resolve(false);
    });

    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });

    req.end();
  });
}

type DaemonOwnershipStatus = 'owned' | 'not-owned' | 'not-running' | 'unknown';

function getProcessCommandLine(pid: number): string | null {
  if (process.platform === 'linux') {
    try {
      // /proc cmdline uses null separators between arguments.
      return fs.readFileSync(`/proc/${pid}/cmdline`, 'utf8').replace(/\0/g, ' ').trim();
    } catch {
      return null;
    }
  }

  if (process.platform === 'darwin') {
    try {
      const result = spawnSync('ps', ['-p', String(pid), '-o', 'command='], {
        encoding: 'utf8',
      });
      if (result.error || result.status !== 0) {
        return null;
      }
      return result.stdout.trim();
    } catch {
      return null;
    }
  }

  if (process.platform === 'win32') {
    const command = `(Get-CimInstance Win32_Process -Filter "ProcessId = ${pid}" | Select-Object -ExpandProperty CommandLine)`;
    const shells = ['powershell.exe', 'powershell', 'pwsh.exe', 'pwsh'];
    for (const shell of shells) {
      try {
        const result = spawnSync(shell, ['-NoProfile', '-Command', command], {
          encoding: 'utf8',
        });
        if (result.error) {
          continue;
        }
        if (result.status !== 0) {
          return null;
        }
        return result.stdout.trim();
      } catch {
        // Try next shell candidate
      }
    }
    return null;
  }

  return null;
}

function verifyDaemonOwnership(pid: number): DaemonOwnershipStatus {
  try {
    process.kill(pid, 0);
  } catch (err) {
    const error = err as NodeJS.ErrnoException;
    if (error.code === 'ESRCH') {
      return 'not-running';
    }
    return 'unknown';
  }

  const commandLine = getProcessCommandLine(pid);
  if (!commandLine) {
    return 'unknown';
  }

  const looksLikeCursorDaemon =
    commandLine.includes('--ccs-daemon') && commandLine.includes('cursor-daemon-entry');

  return looksLikeCursorDaemon ? 'owned' : 'not-owned';
}

/**
 * Get daemon status.
 */
export async function getDaemonStatus(port: number): Promise<CursorDaemonStatus> {
  const running = await isDaemonRunning(port);
  const pid = getPidFromFile();

  return {
    running,
    port,
    pid: running ? (pid ?? undefined) : undefined,
  };
}

/**
 * Read PID from file.
 */
export function getPidFromFile(): number | null {
  const pidFile = getPidFilePath();
  try {
    if (fs.existsSync(pidFile)) {
      const content = fs.readFileSync(pidFile, 'utf8').trim();
      const pid = parseInt(content, 10);
      return isNaN(pid) ? null : pid;
    }
  } catch {
    // Ignore errors
  }
  return null;
}

/**
 * Write PID to file.
 */
export function writePidToFile(pid: number): void {
  const pidFile = getPidFilePath();
  try {
    const dir = path.dirname(pidFile);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
    }
    fs.writeFileSync(pidFile, pid.toString(), { mode: 0o600 });
  } catch {
    // Ignore errors
  }
}

/**
 * Remove PID file.
 */
export function removePidFile(): void {
  const pidFile = getPidFilePath();
  try {
    if (fs.existsSync(pidFile)) {
      fs.unlinkSync(pidFile);
    }
  } catch {
    // Ignore errors
  }
}

/**
 * Start the cursor daemon.
 *
 * @param config Cursor configuration
 * @returns Promise that resolves when daemon is ready
 */
export async function startDaemon(
  config: CursorDaemonConfig
): Promise<{ success: boolean; pid?: number; error?: string }> {
  // Check if already running
  if (await isDaemonRunning(config.port)) {
    return { success: true, pid: getPidFromFile() ?? undefined };
  }

  // Validate port before interpolation (prevents injection)
  if (!Number.isInteger(config.port) || config.port < 1 || config.port > 65535) {
    return { success: false, error: `Invalid port: ${config.port}` };
  }

  const daemonEntry = await resolveDaemonEntrypoint();
  if (!daemonEntry) {
    return {
      success: false,
      error: 'Cursor daemon entrypoint not found. Run `bun run build` and retry.',
    };
  }

  return new Promise((resolve) => {
    let proc: ChildProcess;
    let resolved = false;

    const safeResolve = (result: { success: boolean; pid?: number; error?: string }) => {
      if (resolved) return;
      resolved = true;
      if (checkTimeout) clearTimeout(checkTimeout);
      if (!result.success) removePidFile();
      resolve(result);
    };

    let checkTimeout: NodeJS.Timeout | null = null;

    try {
      const args = [
        daemonEntry,
        '--port',
        String(config.port),
        '--ghost-mode',
        String(config.ghost_mode !== false),
        '--ccs-daemon',
      ];

      proc = spawn(process.execPath, args, {
        stdio: 'ignore',
        detached: true,
      });

      // Unref so parent can exit
      proc.unref();

      if (proc.pid) {
        writePidToFile(proc.pid);
      }

      // Wait for daemon to be ready (poll for up to 30 seconds)
      let attempts = 0;
      const maxAttempts = 30;
      const pollHealth = async () => {
        attempts++;

        if (await isDaemonRunning(config.port)) {
          safeResolve({ success: true, pid: proc.pid });
        } else if (attempts >= maxAttempts) {
          // Kill orphaned process
          if (proc.pid) {
            try {
              process.kill(proc.pid, 'SIGTERM');
            } catch {
              /* already dead */
            }
          }
          safeResolve({
            success: false,
            error: 'Daemon did not start within 30 seconds',
          });
        } else {
          checkTimeout = setTimeout(pollHealth, 1000);
        }
      };
      checkTimeout = setTimeout(pollHealth, 1000);

      proc.on('error', (err) => {
        safeResolve({
          success: false,
          error: `Failed to start daemon: ${err.message}`,
        });
      });

      proc.on('exit', (code, signal) => {
        if (code === null) {
          safeResolve({
            success: false,
            error: `Daemon process was killed by signal ${signal}`,
          });
        } else if (code === 0) {
          safeResolve({
            success: false,
            error: 'Daemon process exited unexpectedly with code 0',
          });
        } else {
          safeResolve({
            success: false,
            error: `Daemon process exited with code ${code}`,
          });
        }
      });
    } catch (err) {
      safeResolve({
        success: false,
        error: `Failed to spawn daemon: ${(err as Error).message}`,
      });
    }
  });
}

/**
 * Stop the cursor daemon.
 */
export async function stopDaemon(): Promise<{ success: boolean; error?: string }> {
  const pid = getPidFromFile();

  if (!pid) {
    // No PID file — daemon is not running or was already stopped
    return { success: true };
  }

  try {
    const ownership = verifyDaemonOwnership(pid);
    if (ownership === 'not-running') {
      removePidFile();
      return { success: true };
    }

    if (ownership === 'not-owned') {
      // PID was reused by an unrelated process.
      removePidFile();
      return { success: true };
    }

    if (ownership === 'unknown') {
      return {
        success: false,
        error: `Refusing to stop PID ${pid}: unable to verify daemon ownership`,
      };
    }

    // Send SIGTERM to the process
    process.kill(pid, 'SIGTERM');

    // Wait for process to exit (up to 5 seconds)
    let attempts = 0;
    while (attempts < 10) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      try {
        // Check if process still exists (kill(pid, 0) throws if not)
        process.kill(pid, 0);
        attempts++;
      } catch {
        // Process no longer exists
        break;
      }
    }

    // Escalate to SIGKILL only if SIGTERM wait loop exhausted
    if (attempts >= 10) {
      try {
        process.kill(pid, 'SIGKILL');
      } catch {
        // Already dead — good
      }
    }

    removePidFile();
    return { success: true };
  } catch (err) {
    const error = err as NodeJS.ErrnoException;
    if (error.code === 'ESRCH') {
      // Process doesn't exist
      removePidFile();
      return { success: true };
    }
    return {
      success: false,
      error: `Failed to stop daemon: ${error.message}`,
    };
  }
}
