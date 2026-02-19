import { describe, expect, it } from 'bun:test';
import {
  parseThinkingCommandArgs,
  parseThinkingOverrideInput,
} from '../../../src/commands/config-thinking-command';

describe('config thinking command parser', () => {
  it('rejects missing required option values', () => {
    const result = parseThinkingCommandArgs(['--mode']);
    expect(result.error).toBe('--mode requires a value');
  });

  it('rejects unknown options', () => {
    const result = parseThinkingCommandArgs(['--unknown-flag']);
    expect(result.error).toBe('Unknown option: --unknown-flag');
  });

  it('parses clear-provider-override with optional tier', () => {
    const withTier = parseThinkingCommandArgs(['--clear-provider-override', 'codex', 'opus']);
    expect(withTier.error).toBeUndefined();
    expect(withTier.options.clearProviderOverride).toEqual({ provider: 'codex', tier: 'opus' });

    const withoutTier = parseThinkingCommandArgs(['--clear-provider-override', 'codex']);
    expect(withoutTier.error).toBeUndefined();
    expect(withoutTier.options.clearProviderOverride).toEqual({ provider: 'codex', tier: undefined });
  });
});

describe('config thinking override normalization', () => {
  it('normalizes off aliases and case', () => {
    expect(parseThinkingOverrideInput('OFF')).toEqual({ value: 'off' });
    expect(parseThinkingOverrideInput('0')).toEqual({ value: 'off' });
  });

  it('accepts valid levels', () => {
    expect(parseThinkingOverrideInput('High')).toEqual({ value: 'high' });
  });

  it('validates numeric bounds', () => {
    expect(parseThinkingOverrideInput('100001').error).toContain('between 0 and 100000');
    expect(parseThinkingOverrideInput('8192')).toEqual({ value: 8192 });
  });
});
