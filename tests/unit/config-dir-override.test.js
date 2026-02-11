/**
 * Config Directory Override Unit Tests
 *
 * Tests CCS_DIR env var and --config-dir flag precedence,
 * getCcsDirSource() diagnostic, and cloud sync path detection.
 */

const assert = require('assert');
const path = require('path');
const os = require('os');

describe('Config Directory Override', function () {
  let originalCcsDir;
  let originalCcsHome;

  beforeEach(function () {
    originalCcsDir = process.env.CCS_DIR;
    originalCcsHome = process.env.CCS_HOME;
    delete process.env.CCS_DIR;
    delete process.env.CCS_HOME;
  });

  afterEach(function () {
    if (originalCcsDir !== undefined) process.env.CCS_DIR = originalCcsDir;
    else delete process.env.CCS_DIR;
    if (originalCcsHome !== undefined) process.env.CCS_HOME = originalCcsHome;
    else delete process.env.CCS_HOME;
  });

  describe('getCcsDir() precedence', function () {
    it('should return ~/.ccs by default', function () {
      const { getCcsDir } = require('../../dist/utils/config-manager');
      const expected = path.join(os.homedir(), '.ccs');
      assert.strictEqual(getCcsDir(), expected);
    });

    it('should use CCS_HOME with .ccs appended (legacy behavior)', function () {
      process.env.CCS_HOME = '/tmp/test-home';
      const { getCcsDir } = require('../../dist/utils/config-manager');
      assert.strictEqual(getCcsDir(), '/tmp/test-home/.ccs');
    });

    it('should use CCS_DIR directly (no .ccs append)', function () {
      process.env.CCS_DIR = '/tmp/my-ccs-config';
      const { getCcsDir } = require('../../dist/utils/config-manager');
      assert.strictEqual(getCcsDir(), path.resolve('/tmp/my-ccs-config'));
    });

    it('should give CCS_DIR precedence over CCS_HOME', function () {
      process.env.CCS_DIR = '/tmp/ccs-dir';
      process.env.CCS_HOME = '/tmp/ccs-home';
      const { getCcsDir } = require('../../dist/utils/config-manager');
      assert.strictEqual(getCcsDir(), path.resolve('/tmp/ccs-dir'));
    });
  });

  describe('getCcsDirSource()', function () {
    it('should return "default" when no overrides set', function () {
      const { getCcsDirSource } = require('../../dist/utils/config-manager');
      const [source] = getCcsDirSource();
      assert.strictEqual(source, 'default');
    });

    it('should return "CCS_DIR" when CCS_DIR is set', function () {
      process.env.CCS_DIR = '/tmp/test';
      const { getCcsDirSource } = require('../../dist/utils/config-manager');
      const [source] = getCcsDirSource();
      assert.strictEqual(source, 'CCS_DIR');
    });

    it('should return "CCS_HOME" when only CCS_HOME is set', function () {
      process.env.CCS_HOME = '/tmp/home';
      const { getCcsDirSource } = require('../../dist/utils/config-manager');
      const [source] = getCcsDirSource();
      assert.strictEqual(source, 'CCS_HOME');
    });
  });

  describe('detectCloudSyncPath()', function () {
    it('should detect Dropbox', function () {
      const { detectCloudSyncPath } = require('../../dist/utils/config-manager');
      assert.strictEqual(detectCloudSyncPath('/Users/kai/Dropbox/ccs'), 'Dropbox');
    });

    it('should detect OneDrive on Windows paths', function () {
      const { detectCloudSyncPath } = require('../../dist/utils/config-manager');
      assert.strictEqual(detectCloudSyncPath('C:\\Users\\kai\\OneDrive\\ccs'), 'OneDrive');
    });

    it('should detect iCloud Drive', function () {
      const { detectCloudSyncPath } = require('../../dist/utils/config-manager');
      assert.strictEqual(
        detectCloudSyncPath('/Users/kai/Library/Mobile Documents/iCloud Drive/ccs'),
        'iCloud Drive'
      );
    });

    it('should detect Google Drive', function () {
      const { detectCloudSyncPath } = require('../../dist/utils/config-manager');
      assert.strictEqual(detectCloudSyncPath('/Users/kai/Google Drive/ccs'), 'Google Drive');
    });

    it('should return null for regular paths', function () {
      const { detectCloudSyncPath } = require('../../dist/utils/config-manager');
      assert.strictEqual(detectCloudSyncPath('/home/kai/.ccs'), null);
    });

    it('should return null for default ~/.ccs path', function () {
      const { detectCloudSyncPath } = require('../../dist/utils/config-manager');
      assert.strictEqual(detectCloudSyncPath(path.join(os.homedir(), '.ccs')), null);
    });
  });
});
