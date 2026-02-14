import { describe, expect, it } from 'bun:test';
import {
  CLIPROXY_PROVIDER_IDS,
  getOAuthCallbackPort,
  getOAuthFlowType,
  getProviderDisplayName,
  getProvidersByOAuthFlow,
  isCLIProxyProvider,
  mapExternalProviderName,
} from '../../../src/cliproxy/provider-capabilities';
import {
  OAUTH_CALLBACK_PORTS as DIAGNOSTIC_CALLBACK_PORTS,
  OAUTH_FLOW_TYPES,
} from '../../../src/management/oauth-port-diagnostics';
import { OAUTH_CALLBACK_PORTS as AUTH_CALLBACK_PORTS } from '../../../src/cliproxy/auth/auth-types';

describe('provider-capabilities', () => {
  it('keeps canonical provider IDs backward-compatible', () => {
    expect(CLIPROXY_PROVIDER_IDS).toEqual([
      'gemini',
      'codex',
      'agy',
      'qwen',
      'iflow',
      'kiro',
      'ghcp',
      'claude',
    ]);
  });

  it('validates provider IDs', () => {
    expect(isCLIProxyProvider('gemini')).toBe(true);
    expect(isCLIProxyProvider('ghcp')).toBe(true);
    expect(isCLIProxyProvider('not-a-provider')).toBe(false);
    expect(isCLIProxyProvider('Gemini')).toBe(false);
  });

  it('returns providers by OAuth flow capability', () => {
    expect(getProvidersByOAuthFlow('device_code')).toEqual(['qwen', 'kiro', 'ghcp']);
    expect(getProvidersByOAuthFlow('authorization_code')).toEqual([
      'gemini',
      'codex',
      'agy',
      'iflow',
      'claude',
    ]);
  });

  it('maps external provider aliases to canonical IDs', () => {
    expect(mapExternalProviderName('gemini-cli')).toBe('gemini');
    expect(mapExternalProviderName('antigravity')).toBe('agy');
    expect(mapExternalProviderName('codewhisperer')).toBe('kiro');
    expect(mapExternalProviderName('github-copilot')).toBe('ghcp');
    expect(mapExternalProviderName('copilot')).toBe('ghcp');
    expect(mapExternalProviderName('anthropic')).toBe('claude');
    expect(mapExternalProviderName('unknown-provider')).toBeNull();
  });

  it('exposes callback port and display name capabilities', () => {
    expect(getOAuthCallbackPort('qwen')).toBeNull();
    expect(getOAuthCallbackPort('kiro')).toBeNull();
    expect(getOAuthCallbackPort('gemini')).toBe(8085);
    expect(getProviderDisplayName('agy')).toBe('AntiGravity');
  });

  it('keeps diagnostics flow metadata in sync with provider capabilities', () => {
    for (const provider of CLIPROXY_PROVIDER_IDS) {
      expect(OAUTH_FLOW_TYPES[provider]).toBe(getOAuthFlowType(provider));
      expect(DIAGNOSTIC_CALLBACK_PORTS[provider]).toBe(getOAuthCallbackPort(provider));
    }
  });

  it('does not define callback ports for device code providers in auth constants', () => {
    for (const provider of getProvidersByOAuthFlow('device_code')) {
      expect(AUTH_CALLBACK_PORTS[provider]).toBeUndefined();
    }
  });
});
