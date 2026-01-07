import { describe, expect, test } from 'bun:test';
import { detectTier, isTier } from '../../../src/router/resolver/tier';

describe('detectTier', () => {
  test('detects opus tier models', () => {
    expect(detectTier('claude-opus-4')).toBe('opus');
    expect(detectTier('claude-4-opus')).toBe('opus');
    expect(detectTier('claude-opus-4-20250514')).toBe('opus');
    expect(detectTier('opus-4')).toBe('opus');
  });

  test('detects sonnet tier models', () => {
    expect(detectTier('claude-sonnet-4')).toBe('sonnet');
    expect(detectTier('claude-3-5-sonnet-20241022')).toBe('sonnet');
    expect(detectTier('claude-3-sonnet')).toBe('sonnet');
    expect(detectTier('sonnet-4')).toBe('sonnet');
  });

  test('detects haiku tier models', () => {
    expect(detectTier('claude-haiku-3')).toBe('haiku');
    expect(detectTier('claude-3-5-haiku-20241022')).toBe('haiku');
    expect(detectTier('claude-3-haiku')).toBe('haiku');
    expect(detectTier('haiku-3')).toBe('haiku');
  });

  test('defaults to sonnet for unknown models', () => {
    expect(detectTier('gpt-4')).toBe('sonnet');
    expect(detectTier('unknown-model')).toBe('sonnet');
    expect(detectTier('gemini-pro')).toBe('sonnet');
  });

  test('is case insensitive', () => {
    expect(detectTier('CLAUDE-OPUS-4')).toBe('opus');
    expect(detectTier('Claude-Sonnet-4')).toBe('sonnet');
    expect(detectTier('CLAUDE-HAIKU-3')).toBe('haiku');
  });
});

describe('isTier', () => {
  test('returns true for matching tier', () => {
    expect(isTier('claude-opus-4', 'opus')).toBe(true);
    expect(isTier('claude-sonnet-4', 'sonnet')).toBe(true);
    expect(isTier('claude-haiku-3', 'haiku')).toBe(true);
  });

  test('returns false for non-matching tier', () => {
    expect(isTier('claude-opus-4', 'sonnet')).toBe(false);
    expect(isTier('claude-sonnet-4', 'haiku')).toBe(false);
    expect(isTier('claude-haiku-3', 'opus')).toBe(false);
  });
});
