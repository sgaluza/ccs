const assert = require('assert');
const { normalizeModelId, MODEL_ID_MAP } = require('../../../dist/agy/model-normalizer');

describe('Model Normalizer', () => {
  describe('MODEL_ID_MAP', () => {
    it('should contain all expected model mappings', () => {
      assert.ok('claude-sonnet-4-5-thinking' in MODEL_ID_MAP);
      assert.ok('claude-opus-4-5-thinking' in MODEL_ID_MAP);
      assert.ok('claude-sonnet-4-5' in MODEL_ID_MAP);
      assert.ok('claude-opus-4-5' in MODEL_ID_MAP);
    });

    it('should map thinking models to dated versions', () => {
      assert.strictEqual(MODEL_ID_MAP['claude-sonnet-4-5-thinking'], 'claude-sonnet-4-5-20250929');
      assert.strictEqual(MODEL_ID_MAP['claude-opus-4-5-thinking'], 'claude-opus-4-5-20251101');
    });

    it('should map non-thinking models to dated versions', () => {
      assert.strictEqual(MODEL_ID_MAP['claude-sonnet-4-5'], 'claude-sonnet-4-5-20250929');
      assert.strictEqual(MODEL_ID_MAP['claude-opus-4-5'], 'claude-opus-4-5-20251101');
    });
  });

  describe('normalizeModelId', () => {
    it('should normalize known model IDs', () => {
      assert.strictEqual(normalizeModelId('claude-opus-4-5-thinking'), 'claude-opus-4-5-20251101');
      assert.strictEqual(normalizeModelId('claude-sonnet-4-5-thinking'), 'claude-sonnet-4-5-20250929');
    });

    it('should pass through unknown model IDs unchanged', () => {
      assert.strictEqual(normalizeModelId('unknown-model'), 'unknown-model');
      assert.strictEqual(normalizeModelId('gemini-3-pro-preview'), 'gemini-3-pro-preview');
      assert.strictEqual(normalizeModelId('claude-3-5-sonnet-20241022'), 'claude-3-5-sonnet-20241022');
    });

    it('should handle empty string', () => {
      assert.strictEqual(normalizeModelId(''), '');
    });

    it('should handle already-normalized IDs', () => {
      // If someone passes a dated version, it should pass through
      assert.strictEqual(normalizeModelId('claude-opus-4-5-20251101'), 'claude-opus-4-5-20251101');
    });
  });
});
