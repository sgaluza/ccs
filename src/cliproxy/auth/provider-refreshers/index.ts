/**
 * Provider Token Refreshers
 *
 * Exports refresh functions for each OAuth provider.
 *
 * Refresh responsibility:
 * - CCS-managed: gemini (CCS refreshes tokens directly via Google OAuth)
 * - CLIProxy-delegated: codex, agy, kiro, ghcp, qwen, iflow, kimi
 *   (CLIProxyAPIPlus handles refresh automatically in background)
 * - Not implemented: claude
 */

import { CLIProxyProvider } from '../../types';
import {
  getTokenRefreshOwnership,
  isRefreshDelegatedToCLIProxy,
} from '../../provider-capabilities';
import { refreshGeminiToken } from '../gemini-token-refresh';

/** Token refresh result */
export interface ProviderRefreshResult {
  success: boolean;
  error?: string;
  expiresAt?: number;
  /** True if refresh is delegated to CLIProxy (not handled by CCS) */
  delegated?: boolean;
}

/**
 * Check if a provider's token refresh is delegated to CLIProxy
 */
export function isRefreshDelegated(provider: CLIProxyProvider): boolean {
  return isRefreshDelegatedToCLIProxy(provider);
}

/**
 * Refresh token for a specific provider and account
 * @param provider Provider to refresh
 * @param _accountId Account ID (currently unused, multi-account not yet implemented)
 * @returns Refresh result with success status and optional error
 */
export async function refreshToken(
  provider: CLIProxyProvider,
  _accountId: string
): Promise<ProviderRefreshResult> {
  if (provider === 'gemini') {
    return await refreshGeminiTokenWrapper();
  }

  if (isRefreshDelegated(provider)) {
    // CLIProxyAPIPlus handles refresh for these providers automatically.
    // No action needed from CCS — report success with delegated flag.
    return { success: true, delegated: true };
  }

  const ownership = getTokenRefreshOwnership(provider);
  if (ownership === 'unsupported') {
    return {
      success: false,
      error: `Token refresh not yet implemented for ${provider}`,
    };
  }

  return {
    success: false,
    error: `Unknown provider: ${provider}`,
  };
}

/**
 * Wrapper for Gemini token refresh
 * Converts gemini-token-refresh.ts format to provider-refreshers format
 */
async function refreshGeminiTokenWrapper(): Promise<ProviderRefreshResult> {
  const result = await refreshGeminiToken();

  if (!result.success) {
    return {
      success: false,
      error: result.error,
    };
  }

  return {
    success: true,
    expiresAt: result.expiresAt,
  };
}
