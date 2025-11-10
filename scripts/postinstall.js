#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

/**
 * CCS Postinstall Script
 * Automatically creates config files in ~/.ccs/ after npm install
 *
 * Runs when: npm install -g @kaitranntt/ccs
 * Idempotent: Safe to run multiple times (won't overwrite existing configs)
 * Cross-platform: Works on Unix, macOS, Windows
 */

/**
 * Validate created configuration files
 * @returns {object} { success: boolean, errors: string[], warnings: string[] }
 */
function validateConfiguration() {
  const homedir = os.homedir();
  const errors = [];
  const warnings = [];

  // Check ~/.ccs/ directory
  const ccsDir = path.join(homedir, '.ccs');
  if (!fs.existsSync(ccsDir)) {
    errors.push('~/.ccs/ directory not found');
  }

  // Check required files
  const requiredFiles = [
    { path: path.join(ccsDir, 'config.json'), name: 'config.json' },
    { path: path.join(ccsDir, 'glm.settings.json'), name: 'glm.settings.json' },
    { path: path.join(ccsDir, 'kimi.settings.json'), name: 'kimi.settings.json' }
  ];

  for (const file of requiredFiles) {
    if (!fs.existsSync(file.path)) {
      errors.push(`${file.name} not found`);
      continue;
    }

    // Validate JSON syntax
    try {
      const content = fs.readFileSync(file.path, 'utf8');
      JSON.parse(content);
    } catch (e) {
      errors.push(`${file.name} has invalid JSON: ${e.message}`);
    }
  }

  // Check ~/.claude/settings.json (warning only, not critical)
  const claudeSettings = path.join(homedir, '.claude', 'settings.json');
  if (!fs.existsSync(claudeSettings)) {
    warnings.push('~/.claude/settings.json not found - run "claude /login"');
  }

  return { success: errors.length === 0, errors, warnings };
}

function createConfigFiles() {
  try {
    // Get user home directory (cross-platform)
    const homedir = os.homedir();
    const ccsDir = path.join(homedir, '.ccs');

    // Create ~/.ccs/ directory if missing
    if (!fs.existsSync(ccsDir)) {
      fs.mkdirSync(ccsDir, { recursive: true, mode: 0o755 });
      console.log('[OK] Created directory: ~/.ccs/');
    }

    // Create config.json if missing
    const configPath = path.join(ccsDir, 'config.json');
    if (!fs.existsSync(configPath)) {
      const config = {
        profiles: {
          glm: '~/.ccs/glm.settings.json',
          kimi: '~/.ccs/kimi.settings.json',
          default: '~/.claude/settings.json'
        }
      };

      // Atomic write: temp file → rename
      const tmpPath = `${configPath}.tmp`;
      fs.writeFileSync(tmpPath, JSON.stringify(config, null, 2) + '\n', 'utf8');
      fs.renameSync(tmpPath, configPath);

      console.log('[OK] Created config: ~/.ccs/config.json');
    } else {
      console.log('[OK] Config exists: ~/.ccs/config.json (preserved)');
    }

    // Create glm.settings.json if missing
    const glmSettingsPath = path.join(ccsDir, 'glm.settings.json');
    if (!fs.existsSync(glmSettingsPath)) {
      const glmSettings = {
        env: {
          ANTHROPIC_BASE_URL: 'https://api.z.ai/api/anthropic',
          ANTHROPIC_AUTH_TOKEN: 'YOUR_GLM_API_KEY_HERE',
          ANTHROPIC_MODEL: 'glm-4.6',
          ANTHROPIC_DEFAULT_OPUS_MODEL: 'glm-4.6',
          ANTHROPIC_DEFAULT_SONNET_MODEL: 'glm-4.6',
          ANTHROPIC_DEFAULT_HAIKU_MODEL: 'glm-4.6'
        }
      };

      // Atomic write
      const tmpPath = `${glmSettingsPath}.tmp`;
      fs.writeFileSync(tmpPath, JSON.stringify(glmSettings, null, 2) + '\n', 'utf8');
      fs.renameSync(tmpPath, glmSettingsPath);

      console.log('[OK] Created GLM profile: ~/.ccs/glm.settings.json');
      console.log('');
      console.log('  [!] Configure GLM API key:');
      console.log('      1. Get key from: https://api.z.ai');
      console.log('      2. Edit: ~/.ccs/glm.settings.json');
      console.log('      3. Replace: YOUR_GLM_API_KEY_HERE');
    } else {
      console.log('[OK] GLM profile exists: ~/.ccs/glm.settings.json (preserved)');
    }

    // Create kimi.settings.json if missing
    const kimiSettingsPath = path.join(ccsDir, 'kimi.settings.json');
    if (!fs.existsSync(kimiSettingsPath)) {
      const kimiSettings = {
        env: {
          ANTHROPIC_BASE_URL: 'https://api.kimi.com/coding/',
          ANTHROPIC_AUTH_TOKEN: 'YOUR_KIMI_API_KEY_HERE',
          ANTHROPIC_MODEL: 'kimi-for-coding',
          ANTHROPIC_SMALL_FAST_MODEL: 'kimi-for-coding',
          ANTHROPIC_DEFAULT_OPUS_MODEL: 'kimi-for-coding',
          ANTHROPIC_DEFAULT_SONNET_MODEL: 'kimi-for-coding',
          ANTHROPIC_DEFAULT_HAIKU_MODEL: 'kimi-for-coding'
        },
        alwaysThinkingEnabled: true
      };

      // Atomic write
      const tmpPath = `${kimiSettingsPath}.tmp`;
      fs.writeFileSync(tmpPath, JSON.stringify(kimiSettings, null, 2) + '\n', 'utf8');
      fs.renameSync(tmpPath, kimiSettingsPath);

      console.log('[OK] Created Kimi profile: ~/.ccs/kimi.settings.json');
      console.log('');
      console.log('  [!] Configure Kimi API key:');
      console.log('      1. Get key from: https://www.kimi.com/coding (membership page)');
      console.log('      2. Edit: ~/.ccs/kimi.settings.json');
      console.log('      3. Replace: YOUR_KIMI_API_KEY_HERE');
    } else {
      console.log('[OK] Kimi profile exists: ~/.ccs/kimi.settings.json (preserved)');
    }

    // Create ~/.claude/settings.json if missing (NEW)
    const claudeDir = path.join(homedir, '.claude');
    const claudeSettingsPath = path.join(claudeDir, 'settings.json');

    if (!fs.existsSync(claudeDir)) {
      fs.mkdirSync(claudeDir, { recursive: true, mode: 0o755 });
      console.log('[OK] Created directory: ~/.claude/');
    }

    if (!fs.existsSync(claudeSettingsPath)) {
      // Create empty settings (matches Claude CLI behavior)
      const tmpPath = `${claudeSettingsPath}.tmp`;
      fs.writeFileSync(tmpPath, '{}\n', 'utf8');
      fs.renameSync(tmpPath, claudeSettingsPath);

      console.log('[OK] Created default settings: ~/.claude/settings.json');
      console.log('');
      console.log('  [i] Configure Claude CLI:');
      console.log('      Run: claude /login');
      console.log('');
    } else {
      console.log('[OK] Claude settings exist: ~/.claude/settings.json (preserved)');
    }

    // Validate configuration
    console.log('');
    console.log('[i] Validating configuration...');
    const validation = validateConfiguration();

    if (!validation.success) {
      console.error('');
      console.error('[X] Configuration validation failed:');
      validation.errors.forEach(err => console.error(`    - ${err}`));
      console.error('');
      throw new Error('Configuration incomplete');
    }

    // Show warnings (non-critical)
    if (validation.warnings.length > 0) {
      console.warn('');
      console.warn('[!] Warnings:');
      validation.warnings.forEach(warn => console.warn(`    - ${warn}`));
    }

    console.log('');
    console.log('[OK] CCS configuration ready!');
    console.log('  Run: ccs --version');

  } catch (err) {
    // Show error details
    console.error('');
    console.error('[X] CCS configuration failed');
    console.error(`    Error: ${err.message}`);
    console.error('');
    console.error('Recovery steps:');
    console.error('  1. Create directory manually:');
    console.error('     mkdir -p ~/.ccs ~/.claude');
    console.error('');
    console.error('  2. Create empty settings:');
    console.error('     echo "{}" > ~/.claude/settings.json');
    console.error('');
    console.error('  3. Retry installation:');
    console.error('     npm install -g @kaitranntt/ccs --force');
    console.error('');
    console.error('  4. If issue persists, report at:');
    console.error('     https://github.com/kaitranntt/ccs/issues');
    console.error('');

    // Exit with error code (npm will show warning)
    process.exit(1);
  }
}

// Run postinstall
createConfigFiles();
