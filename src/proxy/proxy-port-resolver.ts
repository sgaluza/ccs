import { loadOrCreateUnifiedConfig } from '../config/unified-config-loader';
import { OPENAI_COMPAT_PROXY_DEFAULT_PORT } from './proxy-daemon-paths';

export function resolveOpenAICompatProxyPreferredPort(profileName: string): number {
  const config = loadOrCreateUnifiedConfig();
  const profilePort = config.proxy?.profile_ports?.[profileName];
  if (typeof profilePort === 'number') {
    return profilePort;
  }
  return config.proxy?.port ?? OPENAI_COMPAT_PROXY_DEFAULT_PORT;
}
