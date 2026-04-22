#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const bucket = process.argv[2];
const rootDir = path.resolve(__dirname, '..');
const candidateRoots = ['tests/unit', 'tests/integration', 'tests/npm'];
const slowTests = [
  'tests/integration/cursor-daemon-lifecycle.test.ts',
  'tests/integration/proxy/daemon-lifecycle.test.ts',
  'tests/unit/commands/persist-command-handler.test.ts',
  'tests/unit/hooks/ccs-browser-mcp-server.test.ts',
  'tests/unit/targets/codex-runtime-integration.test.ts',
  'tests/unit/targets/codex-settings-bridge-launch.test.ts',
  'tests/unit/targets/droid-command-routing-integration.test.ts',
  'tests/unit/targets/droid-config-manager.test.ts',
  'tests/unit/targets/settings-profile-browser-launch.test.ts',
  'tests/unit/targets/settings-profile-image-analysis-launch.test.ts',
  'tests/unit/targets/settings-profile-websearch-launch.test.ts',
  'tests/unit/web-server/cursor-routes.test.ts',
  'tests/unit/web-server/websearch-routes.test.ts',
];

if (!['fast', 'slow', 'all'].includes(bucket)) {
  console.error('[X] Usage: node scripts/run-test-bucket.js <fast|slow|all>');
  process.exit(1);
}

const filePattern = /(\.test\.(c|m)?[jt]s|\.spec\.(c|m)?[jt]s|-test\.(c|m)?[jt]s)$/;

function collectFiles(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      collectFiles(fullPath, files);
      continue;
    }

    if (filePattern.test(entry.name)) {
      files.push(path.relative(rootDir, fullPath).split(path.sep).join('/'));
    }
  }

  return files;
}

function readsBuiltDist(relativePath) {
  const source = fs.readFileSync(path.join(rootDir, relativePath), 'utf8');
  return source.includes('dist/');
}

const discovered = candidateRoots
  .flatMap((relativeDir) => collectFiles(path.join(rootDir, relativeDir)))
  .sort();
const forceSlow = discovered.filter((file) => {
  if (file.startsWith('tests/npm/')) {
    return true;
  }

  return readsBuiltDist(file);
});
const slowSet = new Set([...slowTests, ...forceSlow]);

function selectBucket(name) {
  return name === 'slow'
    ? [...slowSet].sort()
    : discovered.filter((file) => !slowSet.has(file));
}

function ensureBuildForSlowBucket() {
  if (fs.existsSync(path.join(rootDir, 'dist', 'ccs.js'))) {
    return 0;
  }

  const build = spawnSync('bun', ['run', 'build'], {
    cwd: rootDir,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });

  return build.status ?? 1;
}

function runBucket(name) {
  const selected = selectBucket(name);

  if (selected.length === 0) {
    console.error(`[X] No tests matched the '${name}' bucket.`);
    return 1;
  }

  if (name === 'slow') {
    const buildStatus = ensureBuildForSlowBucket();
    if (buildStatus !== 0) {
      return buildStatus;
    }
  }

  const result = spawnSync(
    'bun',
    ['test', '--max-concurrency=1', ...selected],
    {
      cwd: rootDir,
      stdio: 'inherit',
      shell: process.platform === 'win32',
    },
  );

  return result.status ?? 1;
}

if (bucket === 'all') {
  let exitCode = 0;

  for (const name of ['fast', 'slow']) {
    const status = runBucket(name);
    if (status !== 0) {
      exitCode = status;
    }
  }

  process.exit(exitCode);
}

process.exit(runBucket(bucket));
