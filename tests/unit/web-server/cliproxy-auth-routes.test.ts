import { describe, expect, it } from 'bun:test';
import { getStartUrlUnsupportedReason } from '../../../src/web-server/routes/cliproxy-auth-routes';

describe('cliproxy-auth-routes start-url guard', () => {
  it('rejects device code providers', () => {
    expect(getStartUrlUnsupportedReason('kiro')).toContain("Provider 'kiro' uses Device Code flow");
    expect(getStartUrlUnsupportedReason('ghcp')).toContain("Provider 'ghcp' uses Device Code flow");
    expect(getStartUrlUnsupportedReason('qwen')).toContain("Provider 'qwen' uses Device Code flow");
  });

  it('allows authorization code providers', () => {
    expect(getStartUrlUnsupportedReason('gemini')).toBeNull();
    expect(getStartUrlUnsupportedReason('codex')).toBeNull();
    expect(getStartUrlUnsupportedReason('claude')).toBeNull();
  });
});
