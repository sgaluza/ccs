/**
 * Instance Manager (Simplified)
 *
 * Manages isolated Claude CLI instances per profile for concurrent sessions.
 * Each instance is an isolated CLAUDE_CONFIG_DIR where users login directly.
 * No credential copying/encryption - Claude manages credentials per instance.
 */

import * as fs from 'fs';
import * as path from 'path';
import SharedManager from './shared-manager';
import ProfileContextSyncLock from './profile-context-sync-lock';
import { AccountContextPolicy, DEFAULT_ACCOUNT_CONTEXT_MODE } from '../auth/account-context';
import { getCcsDir, getCcsHome } from '../utils/config-manager';

/** Options for instance creation */
interface InstanceOptions {
  /** Skip shared symlinks (commands, skills, agents, settings.json) */
  bare?: boolean;
}

/**
 * Instance Manager Class
 */
class InstanceManager {
  private readonly instancesDir: string;
  private readonly sharedManager: SharedManager;
  private readonly contextSyncLock: ProfileContextSyncLock;

  constructor() {
    this.instancesDir = path.join(getCcsDir(), 'instances');
    this.sharedManager = new SharedManager();
    this.contextSyncLock = new ProfileContextSyncLock(this.instancesDir);
  }

  /**
   * Ensure instance exists for profile (lazy init only)
   */
  async ensureInstance(
    profileName: string,
    contextPolicy: AccountContextPolicy = { mode: DEFAULT_ACCOUNT_CONTEXT_MODE },
    options: InstanceOptions = {}
  ): Promise<string> {
    const instancePath = this.getInstancePath(profileName);

    // Serialize context sync operations per profile across processes.
    await this.contextSyncLock.withLock(profileName, async () => {
      // Lazy initialization
      if (!fs.existsSync(instancePath)) {
        this.initializeInstance(profileName, instancePath, options);
      }

      // Validate structure (auto-fix missing dirs)
      this.validateInstance(instancePath);

      // Apply context policy (isolated by default, optional shared group).
      await this.sharedManager.syncProjectContext(instancePath, contextPolicy);
      await this.sharedManager.syncAdvancedContinuityArtifacts(instancePath, contextPolicy);
    });

    // Sync MCP servers from global ~/.claude.json (unless bare)
    if (!options.bare) {
      this.syncMcpServers(instancePath);
    }

    return instancePath;
  }

  /**
   * Get instance path for profile
   */
  getInstancePath(profileName: string): string {
    const safeName = this.sanitizeName(profileName);
    return path.join(this.instancesDir, safeName);
  }

  /**
   * Initialize new instance directory
   */
  private initializeInstance(
    profileName: string,
    instancePath: string,
    options: InstanceOptions = {}
  ): void {
    try {
      // Create base directory
      fs.mkdirSync(instancePath, { recursive: true, mode: 0o700 });

      // Create Claude-expected subdirectories (profile-specific only)
      const subdirs = [
        'session-env',
        'todos',
        'logs',
        'file-history',
        'shell-snapshots',
        'debug',
        '.anthropic',
      ];

      subdirs.forEach((dir) => {
        const dirPath = path.join(instancePath, dir);
        if (!fs.existsSync(dirPath)) {
          fs.mkdirSync(dirPath, { recursive: true, mode: 0o700 });
        }
      });

      // Bare profiles skip shared symlinks (commands, skills, agents, settings.json)
      if (!options.bare) {
        this.sharedManager.linkSharedDirectories(instancePath);
      }

      // Copy global configs if exist (settings.json only)
      this.copyGlobalConfigs(instancePath);
    } catch (error) {
      throw new Error(
        `Failed to initialize instance for ${profileName}: ${(error as Error).message}`
      );
    }
  }

  /**
   * Validate instance directory structure (auto-fix missing directories)
   */
  private validateInstance(instancePath: string): void {
    // Check required directories (auto-create if missing for migration)
    const requiredDirs = [
      'session-env',
      'todos',
      'logs',
      'file-history',
      'shell-snapshots',
      'debug',
      '.anthropic',
    ];

    for (const dir of requiredDirs) {
      const dirPath = path.join(instancePath, dir);
      if (!fs.existsSync(dirPath)) {
        // Auto-create missing directory (migration from older versions)
        fs.mkdirSync(dirPath, { recursive: true, mode: 0o700 });
      }
    }

    // Note: Credentials managed by Claude CLI in instance (no validation needed)
  }

  /**
   * Delete instance for profile
   */
  deleteInstance(profileName: string): void {
    const instancePath = this.getInstancePath(profileName);

    if (!fs.existsSync(instancePath)) {
      return;
    }

    // Recursive delete
    fs.rmSync(instancePath, { recursive: true, force: true });
  }

  /**
   * List all instance names
   */
  listInstances(): string[] {
    if (!fs.existsSync(this.instancesDir)) {
      return [];
    }

    return fs.readdirSync(this.instancesDir).filter((name) => {
      const instancePath = path.join(this.instancesDir, name);
      return fs.statSync(instancePath).isDirectory();
    });
  }

  /**
   * Check if instance exists for profile
   */
  hasInstance(profileName: string): boolean {
    const instancePath = this.getInstancePath(profileName);
    return fs.existsSync(instancePath);
  }

  /**
   * Copy global configs to instance (optional)
   */
  private copyGlobalConfigs(_instancePath: string): void {
    // No longer needed - settings.json now symlinked via SharedManager
  }

  /**
   * Sync MCP servers from global ~/.claude.json to instance .claude.json.
   * Selectively copies only mcpServers key (not OAuth sessions or caches).
   */
  syncMcpServers(instancePath: string): void {
    const homeDir = getCcsHome();
    const globalClaudeJson = path.join(homeDir, '.claude.json');

    if (!fs.existsSync(globalClaudeJson)) {
      return;
    }

    try {
      const globalContent = JSON.parse(fs.readFileSync(globalClaudeJson, 'utf8'));
      const mcpServers = globalContent.mcpServers;

      if (!mcpServers || Object.keys(mcpServers).length === 0) {
        return;
      }

      const instanceClaudeJson = path.join(instancePath, '.claude.json');
      let instanceContent: Record<string, unknown> = {};

      if (fs.existsSync(instanceClaudeJson)) {
        try {
          instanceContent = JSON.parse(fs.readFileSync(instanceClaudeJson, 'utf8'));
        } catch {
          // Corrupted file, start fresh
          instanceContent = {};
        }
      }

      // Merge: global MCP servers as base, instance-specific overrides on top
      const existingMcp = (instanceContent.mcpServers as Record<string, unknown> | undefined) || {};
      instanceContent.mcpServers = { ...mcpServers, ...existingMcp };

      fs.writeFileSync(instanceClaudeJson, JSON.stringify(instanceContent, null, 2), 'utf8');
    } catch {
      // Best-effort: don't fail instance creation if MCP sync fails
    }
  }

  /**
   * Sanitize profile name for filesystem
   */
  private sanitizeName(name: string): string {
    // Replace unsafe characters with dash
    return name.replace(/[^a-zA-Z0-9_-]/g, '-').toLowerCase();
  }
}

export { InstanceManager };
export default InstanceManager;
