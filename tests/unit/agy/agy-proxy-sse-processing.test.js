const assert = require('assert');
const { AgyProxy } = require('../../../dist/agy/agy-proxy');

/**
 * Test helper to access private processSSELine method
 * Uses bind to maintain correct 'this' context
 */
function getProcessSSELine(proxy) {
  return proxy.processSSELine.bind(proxy);
}

/**
 * Test helper to access private toolUseBuffers
 */
function getToolUseBuffers(proxy) {
  return proxy.toolUseBuffers;
}

describe('AgyProxy SSE Processing', () => {
  let proxy;
  let processSSELine;

  beforeEach(() => {
    proxy = new AgyProxy({
      upstreamUrl: 'http://localhost:8317/api/provider/agy',
      verbose: false,
    });
    processSSELine = getProcessSSELine(proxy);
  });

  describe('Non-data lines', () => {
    it('should pass through event: lines unchanged', () => {
      const result = processSSELine('event: message');
      assert.deepStrictEqual(result, ['event: message']);
    });

    it('should pass through empty lines unchanged', () => {
      const result = processSSELine('');
      assert.deepStrictEqual(result, ['']);
    });

    it('should pass through comment lines unchanged', () => {
      const result = processSSELine(': keep-alive');
      assert.deepStrictEqual(result, [': keep-alive']);
    });
  });

  describe('[DONE] marker', () => {
    it('should pass through [DONE] marker unchanged', () => {
      const result = processSSELine('data: [DONE]');
      assert.deepStrictEqual(result, ['data: [DONE]']);
    });
  });

  describe('message_start model normalization', () => {
    it('should normalize claude-opus-4-5-thinking to dated version', () => {
      const line =
        'data: {"type":"message_start","message":{"id":"msg_01","type":"message","role":"assistant","model":"claude-opus-4-5-thinking","content":[]}}';
      const result = processSSELine(line);

      assert.strictEqual(result.length, 1);
      const data = JSON.parse(result[0].slice(6));
      assert.strictEqual(data.message.model, 'claude-opus-4-5-20251101');
    });

    it('should normalize claude-sonnet-4-5-thinking to dated version', () => {
      const line =
        'data: {"type":"message_start","message":{"id":"msg_01","type":"message","role":"assistant","model":"claude-sonnet-4-5-thinking","content":[]}}';
      const result = processSSELine(line);

      assert.strictEqual(result.length, 1);
      const data = JSON.parse(result[0].slice(6));
      assert.strictEqual(data.message.model, 'claude-sonnet-4-5-20250929');
    });

    it('should pass through already valid model IDs unchanged', () => {
      const line =
        'data: {"type":"message_start","message":{"id":"msg_01","type":"message","role":"assistant","model":"claude-3-5-sonnet-20241022","content":[]}}';
      const result = processSSELine(line);

      assert.strictEqual(result.length, 1);
      const data = JSON.parse(result[0].slice(6));
      assert.strictEqual(data.message.model, 'claude-3-5-sonnet-20241022');
    });
  });

  describe('tool_use content_block_start buffering', () => {
    it('should buffer tool_use content_block_start and not emit immediately', () => {
      const line =
        'data: {"type":"content_block_start","index":0,"content_block":{"type":"tool_use","id":"toolu_01","name":"Read","input":{}}}';
      const result = processSSELine(line);

      // Should not emit - buffering
      assert.deepStrictEqual(result, []);

      // Check buffer contains the event
      const buffers = getToolUseBuffers(proxy);
      assert.ok(buffers.has(0));
      assert.strictEqual(buffers.get(0).name, 'Read');
      assert.strictEqual(buffers.get(0).id, 'toolu_01');
    });

    it('should buffer multiple tool_use blocks independently', () => {
      const line1 =
        'data: {"type":"content_block_start","index":0,"content_block":{"type":"tool_use","id":"toolu_01","name":"Read","input":{}}}';
      const line2 =
        'data: {"type":"content_block_start","index":1,"content_block":{"type":"tool_use","id":"toolu_02","name":"Write","input":{}}}';

      processSSELine(line1);
      processSSELine(line2);

      const buffers = getToolUseBuffers(proxy);
      assert.ok(buffers.has(0));
      assert.ok(buffers.has(1));
      assert.strictEqual(buffers.get(0).name, 'Read');
      assert.strictEqual(buffers.get(1).name, 'Write');
    });
  });

  describe('input_json_delta accumulation', () => {
    it('should accumulate input_json_delta chunks', () => {
      // Start tool_use
      const startLine =
        'data: {"type":"content_block_start","index":0,"content_block":{"type":"tool_use","id":"toolu_01","name":"Read","input":{}}}';
      processSSELine(startLine);

      // Send delta chunks
      const delta1 =
        'data: {"type":"content_block_delta","index":0,"delta":{"type":"input_json_delta","partial_json":"{\\"file_pa"}}';
      const delta2 =
        'data: {"type":"content_block_delta","index":0,"delta":{"type":"input_json_delta","partial_json":"th\\": \\"/test.txt\\"}"}}';

      const result1 = processSSELine(delta1);
      const result2 = processSSELine(delta2);

      // Should not emit during accumulation
      assert.deepStrictEqual(result1, []);
      assert.deepStrictEqual(result2, []);

      // Check accumulated input
      const buffers = getToolUseBuffers(proxy);
      const accumulated = buffers.get(0).inputJson;
      assert.strictEqual(accumulated, '{"file_path": "/test.txt"}');
    });
  });

  describe('content_block_stop validation and emission', () => {
    it('should emit valid tool_use on content_block_stop', () => {
      // Start tool_use
      const startLine =
        'data: {"type":"content_block_start","index":0,"content_block":{"type":"tool_use","id":"toolu_01","name":"Read","input":{}}}';
      processSSELine(startLine);

      // Accumulate valid input
      const delta =
        'data: {"type":"content_block_delta","index":0,"delta":{"type":"input_json_delta","partial_json":"{\\"file_path\\": \\"/test/file.txt\\"}"}}';
      processSSELine(delta);

      // Stop event should trigger validation and emission
      const stopLine = 'data: {"type":"content_block_stop","index":0}';
      const result = processSSELine(stopLine);

      // Should emit 2 lines: modified start event (with input) and stop event
      assert.strictEqual(result.length, 2);

      // First line should be the content_block_start with validated input
      const startData = JSON.parse(result[0].slice(6));
      assert.strictEqual(startData.type, 'content_block_start');
      assert.strictEqual(startData.content_block.name, 'Read');
      assert.strictEqual(startData.content_block.input.file_path, '/test/file.txt');

      // Second line should be the stop event
      const stopData = JSON.parse(result[1].slice(6));
      assert.strictEqual(stopData.type, 'content_block_stop');
    });

    it('should reject tool_use with empty input and emit error block', () => {
      // Start tool_use
      const startLine =
        'data: {"type":"content_block_start","index":0,"content_block":{"type":"tool_use","id":"toolu_01","name":"Read","input":{}}}';
      processSSELine(startLine);

      // No delta - input stays empty

      // Stop event should detect empty input
      const stopLine = 'data: {"type":"content_block_stop","index":0}';
      const result = processSSELine(stopLine);

      // Should emit 2 lines: error text block and stop event
      assert.strictEqual(result.length, 2);

      // First line should be error text block
      const errorData = JSON.parse(result[0].slice(6));
      assert.strictEqual(errorData.type, 'content_block_start');
      assert.strictEqual(errorData.content_block.type, 'text');
      assert.ok(errorData.content_block.text.includes('Tool call failed'));
      assert.ok(errorData.content_block.text.includes('Read'));
    });

    it('should reject tool_use with missing required params', () => {
      // Start tool_use for Edit (requires file_path, old_string, new_string)
      const startLine =
        'data: {"type":"content_block_start","index":0,"content_block":{"type":"tool_use","id":"toolu_01","name":"Edit","input":{}}}';
      processSSELine(startLine);

      // Only provide file_path (missing old_string, new_string)
      const delta =
        'data: {"type":"content_block_delta","index":0,"delta":{"type":"input_json_delta","partial_json":"{\\"file_path\\": \\"/test.txt\\"}"}}';
      processSSELine(delta);

      // Stop event
      const stopLine = 'data: {"type":"content_block_stop","index":0}';
      const result = processSSELine(stopLine);

      // Should emit error block
      const errorData = JSON.parse(result[0].slice(6));
      assert.strictEqual(errorData.content_block.type, 'text');
      assert.ok(errorData.content_block.text.includes('old_string'));
    });

    it('should reject tool_use with invalid JSON input', () => {
      // Start tool_use
      const startLine =
        'data: {"type":"content_block_start","index":0,"content_block":{"type":"tool_use","id":"toolu_01","name":"Read","input":{}}}';
      processSSELine(startLine);

      // Send invalid JSON
      const delta =
        'data: {"type":"content_block_delta","index":0,"delta":{"type":"input_json_delta","partial_json":"{invalid json}"}}';
      processSSELine(delta);

      // Stop event
      const stopLine = 'data: {"type":"content_block_stop","index":0}';
      const result = processSSELine(stopLine);

      // Should emit error block
      const errorData = JSON.parse(result[0].slice(6));
      assert.strictEqual(errorData.content_block.type, 'text');
      assert.ok(errorData.content_block.text.includes('Invalid JSON'));
    });
  });

  describe('Non-tool_use events passthrough', () => {
    it('should pass through text content_block_start unchanged', () => {
      const line =
        'data: {"type":"content_block_start","index":0,"content_block":{"type":"text","text":""}}';
      const result = processSSELine(line);

      assert.deepStrictEqual(result, [line]);
    });

    it('should pass through text_delta unchanged', () => {
      const line =
        'data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"Hello"}}';
      const result = processSSELine(line);

      assert.deepStrictEqual(result, [line]);
    });

    it('should pass through thinking content blocks unchanged', () => {
      const line =
        'data: {"type":"content_block_start","index":0,"content_block":{"type":"thinking","thinking":""}}';
      const result = processSSELine(line);

      assert.deepStrictEqual(result, [line]);
    });

    it('should pass through message_delta unchanged', () => {
      const line =
        'data: {"type":"message_delta","delta":{"stop_reason":"end_turn"},"usage":{"output_tokens":100}}';
      const result = processSSELine(line);

      assert.deepStrictEqual(result, [line]);
    });

    it('should pass through content_block_stop for non-buffered blocks', () => {
      // Stop event without a buffered tool_use should pass through
      const line = 'data: {"type":"content_block_stop","index":5}';
      const result = processSSELine(line);

      assert.deepStrictEqual(result, [line]);
    });
  });

  describe('Edge cases', () => {
    it('should handle malformed JSON gracefully', () => {
      const line = 'data: {not valid json at all';
      const result = processSSELine(line);

      // Should pass through unchanged on parse failure
      assert.deepStrictEqual(result, [line]);
    });

    it('should handle empty data payload', () => {
      const line = 'data: ';
      const result = processSSELine(line);

      assert.deepStrictEqual(result, [line]);
    });

    it('should handle delta for non-existent buffer (pass through)', () => {
      // Delta for index that was never started
      const delta =
        'data: {"type":"content_block_delta","index":99,"delta":{"type":"input_json_delta","partial_json":"test"}}';
      const result = processSSELine(delta);

      // Should pass through since no buffer exists for index 99
      assert.deepStrictEqual(result, [delta]);
    });

    it('should clear buffer after processing', () => {
      // Start, accumulate, stop
      const startLine =
        'data: {"type":"content_block_start","index":0,"content_block":{"type":"tool_use","id":"toolu_01","name":"Read","input":{}}}';
      processSSELine(startLine);

      const delta =
        'data: {"type":"content_block_delta","index":0,"delta":{"type":"input_json_delta","partial_json":"{\\"file_path\\": \\"/test.txt\\"}"}}';
      processSSELine(delta);

      const stopLine = 'data: {"type":"content_block_stop","index":0}';
      processSSELine(stopLine);

      // Buffer should be cleared
      const buffers = getToolUseBuffers(proxy);
      assert.strictEqual(buffers.has(0), false);
    });
  });
});
