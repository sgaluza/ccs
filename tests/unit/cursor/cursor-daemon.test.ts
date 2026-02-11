/**
 * Unit tests for Cursor daemon module
 */

import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import {
  getPidFromFile,
  writePidToFile,
  removePidFile,
  isDaemonRunning,
} from '../../../src/cursor/cursor-daemon';

// Test isolation
let originalCcsHome: string | undefined;
let tempDir: string;

beforeEach(() => {
  originalCcsHome = process.env.CCS_HOME;
  tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccs-daemon-test-'));
  process.env.CCS_HOME = tempDir;
});

afterEach(() => {
  if (originalCcsHome !== undefined) {
    process.env.CCS_HOME = originalCcsHome;
  } else {
    delete process.env.CCS_HOME;
  }

  // Cleanup temp directory
  try {
    fs.rmSync(tempDir, { recursive: true, force: true });
  } catch {
    // Ignore cleanup errors
  }
});

// CCS_HOME is set to tempDir; getCcsDir() appends '.ccs' to it
const ccsDir = () => path.join(tempDir, '.ccs');

describe('getPidFromFile', () => {
  it('returns null when no PID file exists', () => {
    expect(getPidFromFile()).toBeNull();
  });

  it('returns PID when valid PID file exists', () => {
    const cursorDir = path.join(ccsDir(), 'cursor');
    fs.mkdirSync(cursorDir, { recursive: true });
    fs.writeFileSync(path.join(cursorDir, 'daemon.pid'), '12345');

    expect(getPidFromFile()).toBe(12345);
  });

  it('returns null when PID file contains invalid content', () => {
    const cursorDir = path.join(ccsDir(), 'cursor');
    fs.mkdirSync(cursorDir, { recursive: true });
    fs.writeFileSync(path.join(cursorDir, 'daemon.pid'), 'not-a-number');

    expect(getPidFromFile()).toBeNull();
  });

  it('trims whitespace from PID file content', () => {
    const cursorDir = path.join(ccsDir(), 'cursor');
    fs.mkdirSync(cursorDir, { recursive: true });
    fs.writeFileSync(path.join(cursorDir, 'daemon.pid'), '  42  \n');

    expect(getPidFromFile()).toBe(42);
  });
});

describe('writePidToFile', () => {
  it('creates PID file with correct content', () => {
    writePidToFile(12345);

    const pidFile = path.join(ccsDir(), 'cursor', 'daemon.pid');
    expect(fs.existsSync(pidFile)).toBe(true);
    expect(fs.readFileSync(pidFile, 'utf8')).toBe('12345');
  });

  it('creates cursor directory if it does not exist', () => {
    const cursorDir = path.join(ccsDir(), 'cursor');
    expect(fs.existsSync(cursorDir)).toBe(false);

    writePidToFile(999);

    expect(fs.existsSync(cursorDir)).toBe(true);
  });

  it('overwrites existing PID file', () => {
    writePidToFile(111);
    writePidToFile(222);

    const pidFile = path.join(ccsDir(), 'cursor', 'daemon.pid');
    expect(fs.readFileSync(pidFile, 'utf8')).toBe('222');
  });
});

describe('removePidFile', () => {
  it('removes existing PID file', () => {
    writePidToFile(12345);
    const pidFile = path.join(ccsDir(), 'cursor', 'daemon.pid');
    expect(fs.existsSync(pidFile)).toBe(true);

    removePidFile();

    expect(fs.existsSync(pidFile)).toBe(false);
  });

  it('does not throw when PID file does not exist', () => {
    expect(() => removePidFile()).not.toThrow();
  });
});

describe('isDaemonRunning', () => {
  it('returns false when no daemon is running on port', async () => {
    // Use a port that should not have anything running
    const result = await isDaemonRunning(19999);
    expect(result).toBe(false);
  });
});
