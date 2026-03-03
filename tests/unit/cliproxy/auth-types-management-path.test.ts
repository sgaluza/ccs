import { describe, expect, it } from 'bun:test';
import {
  getManagementAuthUrlPath,
  getManagementOAuthCallbackPath,
} from '../../../src/cliproxy/auth/auth-types';

describe('auth-types management auth-url path', () => {
  it('maps providers to CLIProxyAPI management auth-url routes', () => {
    expect(getManagementAuthUrlPath('gemini')).toBe(
      '/v0/management/gemini-cli-auth-url?is_webui=true'
    );
    expect(getManagementAuthUrlPath('codex')).toBe('/v0/management/codex-auth-url?is_webui=true');
    expect(getManagementAuthUrlPath('agy')).toBe(
      '/v0/management/antigravity-auth-url?is_webui=true'
    );
    expect(getManagementAuthUrlPath('claude')).toBe(
      '/v0/management/anthropic-auth-url?is_webui=true'
    );
    expect(getManagementAuthUrlPath('ghcp')).toBe('/v0/management/github-auth-url?is_webui=true');
    expect(getManagementAuthUrlPath('kiro')).toBe('/v0/management/kiro-auth-url?is_webui=true');
  });

  it('uses CLIProxyAPI management oauth-callback route', () => {
    expect(getManagementOAuthCallbackPath()).toBe('/v0/management/oauth-callback');
  });
});
