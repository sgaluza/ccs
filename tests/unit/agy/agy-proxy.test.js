const assert = require('assert');
const { AgyProxy } = require('../../../dist/agy/agy-proxy');

describe('AgyProxy', () => {
  describe('processSSELine (via public interface simulation)', () => {
    // We'll test the SSE processing logic by examining the proxy behavior
    // Since processSSELine is private, we test through the class behavior

    it('should create proxy instance with valid config', () => {
      const proxy = new AgyProxy({
        upstreamUrl: 'http://localhost:8317/api/provider/agy',
        verbose: false,
      });
      assert.ok(proxy);
      assert.strictEqual(proxy.getPort(), null); // Not started yet
    });

    it('should accept verbose option', () => {
      const proxy = new AgyProxy({
        upstreamUrl: 'http://localhost:8317',
        verbose: true,
      });
      assert.ok(proxy);
    });

    it('should accept custom timeout', () => {
      const proxy = new AgyProxy({
        upstreamUrl: 'http://localhost:8317',
        timeout: 60000,
      });
      assert.ok(proxy);
    });
  });

  describe('Tool Use Validation Logic', () => {
    // Test the validation through a mock-like approach
    // We instantiate the proxy and call its internal validation method indirectly

    let proxy;

    beforeEach(() => {
      proxy = new AgyProxy({
        upstreamUrl: 'http://localhost:8317/api/provider/agy',
        verbose: false,
      });
    });

    // Test validateToolInput via reflection (accessing private method)
    // This is necessary because the method is private but critical to test
    describe('validateToolInput (private method testing)', () => {
      // Access private method for testing
      function getValidateToolInput(proxyInstance) {
        return proxyInstance.validateToolInput.bind(proxyInstance);
      }

      it('should validate Read tool requires file_path', () => {
        const validate = getValidateToolInput(proxy);

        // Valid input
        const validResult = validate('Read', '{"file_path": "/test/file.txt"}');
        assert.strictEqual(validResult.valid, true);

        // Missing file_path
        const invalidResult = validate('Read', '{"other": "value"}');
        assert.strictEqual(invalidResult.valid, false);
        assert.ok(invalidResult.error.includes('file_path'));
      });

      it('should validate Edit tool requires file_path, old_string, new_string', () => {
        const validate = getValidateToolInput(proxy);

        // Valid input
        const validResult = validate(
          'Edit',
          '{"file_path": "/test.txt", "old_string": "old", "new_string": "new"}'
        );
        assert.strictEqual(validResult.valid, true);

        // Missing old_string
        const missingOld = validate('Edit', '{"file_path": "/test.txt", "new_string": "new"}');
        assert.strictEqual(missingOld.valid, false);
        assert.ok(missingOld.error.includes('old_string'));

        // Missing new_string
        const missingNew = validate('Edit', '{"file_path": "/test.txt", "old_string": "old"}');
        assert.strictEqual(missingNew.valid, false);
        assert.ok(missingNew.error.includes('new_string'));

        // Missing file_path
        const missingFile = validate('Edit', '{"old_string": "old", "new_string": "new"}');
        assert.strictEqual(missingFile.valid, false);
        assert.ok(missingFile.error.includes('file_path'));
      });

      it('should validate Write tool requires file_path and content', () => {
        const validate = getValidateToolInput(proxy);

        // Valid input
        const validResult = validate('Write', '{"file_path": "/test.txt", "content": "hello"}');
        assert.strictEqual(validResult.valid, true);

        // Missing content
        const missingContent = validate('Write', '{"file_path": "/test.txt"}');
        assert.strictEqual(missingContent.valid, false);
        assert.ok(missingContent.error.includes('content'));
      });

      it('should validate Glob tool requires pattern', () => {
        const validate = getValidateToolInput(proxy);

        const validResult = validate('Glob', '{"pattern": "**/*.ts"}');
        assert.strictEqual(validResult.valid, true);

        const invalidResult = validate('Glob', '{"path": "/src"}');
        assert.strictEqual(invalidResult.valid, false);
        assert.ok(invalidResult.error.includes('pattern'));
      });

      it('should validate Grep tool requires pattern', () => {
        const validate = getValidateToolInput(proxy);

        const validResult = validate('Grep', '{"pattern": "function.*test"}');
        assert.strictEqual(validResult.valid, true);

        const invalidResult = validate('Grep', '{"path": "/src"}');
        assert.strictEqual(invalidResult.valid, false);
        assert.ok(invalidResult.error.includes('pattern'));
      });

      it('should validate Bash tool requires command', () => {
        const validate = getValidateToolInput(proxy);

        const validResult = validate('Bash', '{"command": "ls -la"}');
        assert.strictEqual(validResult.valid, true);

        const invalidResult = validate('Bash', '{"description": "list files"}');
        assert.strictEqual(invalidResult.valid, false);
        assert.ok(invalidResult.error.includes('command'));
      });

      it('should validate Task tool requires description, prompt, subagent_type', () => {
        const validate = getValidateToolInput(proxy);

        const validResult = validate(
          'Task',
          '{"description": "test", "prompt": "do something", "subagent_type": "Explore"}'
        );
        assert.strictEqual(validResult.valid, true);

        const missingDesc = validate('Task', '{"prompt": "test", "subagent_type": "Explore"}');
        assert.strictEqual(missingDesc.valid, false);
        assert.ok(missingDesc.error.includes('description'));
      });

      it('should reject empty input object', () => {
        const validate = getValidateToolInput(proxy);

        const emptyResult = validate('Read', '{}');
        assert.strictEqual(emptyResult.valid, false);
        assert.ok(emptyResult.error.includes('Empty'));
      });

      it('should reject invalid JSON', () => {
        const validate = getValidateToolInput(proxy);

        const invalidJson = validate('Read', '{invalid json}');
        assert.strictEqual(invalidJson.valid, false);
        assert.ok(invalidJson.error.includes('Invalid JSON'));
      });

      it('should accept unknown tools with any non-empty input', () => {
        const validate = getValidateToolInput(proxy);

        // Unknown tool should pass as long as input is non-empty
        const unknownTool = validate('UnknownTool', '{"anything": "value"}');
        assert.strictEqual(unknownTool.valid, true);
      });

      it('should handle null/undefined inputJson', () => {
        const validate = getValidateToolInput(proxy);

        // Empty string should parse to {}
        const emptyString = validate('Read', '');
        assert.strictEqual(emptyString.valid, false);
        assert.ok(emptyString.error.includes('Empty'));
      });
    });
  });
});
