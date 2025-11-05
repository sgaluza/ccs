const assert = require('assert');
const path = require('path');
const os = require('os');
const { expandPath, validateProfileName, isPathSafe } = require('../../../bin/helpers');

describe('helpers', () => {
  describe('expandPath', () => {
    it('expands tilde to home directory', () => {
      const expanded = expandPath('~/test');
      assert.strictEqual(expanded, path.join(os.homedir(), 'test'));
    });

    it('expands environment variables', () => {
      process.env.TEST_VAR = '/test/path';
      const expanded = expandPath('${TEST_VAR}/file');
      assert(expanded.includes('test'));
      delete process.env.TEST_VAR;
    });

    it('handles Windows paths', () => {
      if (process.platform === 'win32') {
        const expanded = expandPath('%USERPROFILE%\\test');
        assert(expanded.includes(os.homedir()));
      }
    });
  });

  describe('validateProfileName', () => {
    it('accepts valid profile names', () => {
      assert(validateProfileName('glm'));
      assert(validateProfileName('sonnet-4-5'));
      assert(validateProfileName('my_profile'));
      assert(validateProfileName('profile123'));
    });

    it('rejects invalid profile names', () => {
      assert(!validateProfileName('profile with spaces'));
      assert(!validateProfileName('profile@special'));
      assert(!validateProfileName('profile;injection'));
    });
  });

  describe('isPathSafe', () => {
    it('accepts safe paths', () => {
      assert(isPathSafe('/usr/local/bin/claude'));
      assert(isPathSafe('C:\\Program Files\\Claude\\claude.exe'));
      assert(isPathSafe('/home/user/.local/bin/claude'));
    });

    it('rejects unsafe paths', () => {
      assert(!isPathSafe('/usr/bin/claude; rm -rf /'));
      assert(!isPathSafe('/usr/bin/claude|bash'));
      assert(!isPathSafe('/usr/bin/claude&echo pwned'));
      assert(!isPathSafe('/usr/bin/claude$(whoami)'));
    });
  });
});