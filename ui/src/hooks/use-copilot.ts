/**
 * Copilot API Hook
 *
 * React hook for managing GitHub Copilot integration state.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const API_BASE = '/api';

// Types
export interface CopilotStatus {
  enabled: boolean;
  installed: boolean;
  authenticated: boolean;
  daemon_running: boolean;
  port: number;
  model: string;
  account_type: 'individual' | 'business' | 'enterprise';
  auto_start: boolean;
  rate_limit: number | null;
  wait_on_limit: boolean;
}

export interface CopilotConfig {
  enabled: boolean;
  auto_start: boolean;
  port: number;
  account_type: 'individual' | 'business' | 'enterprise';
  rate_limit: number | null;
  wait_on_limit: boolean;
  model: string;
}

export interface CopilotModel {
  id: string;
  name: string;
  provider: 'openai' | 'anthropic';
  isDefault?: boolean;
  isCurrent?: boolean;
}

// API functions
async function fetchCopilotStatus(): Promise<CopilotStatus> {
  const res = await fetch(`${API_BASE}/copilot/status`);
  if (!res.ok) throw new Error('Failed to fetch copilot status');
  return res.json();
}

async function fetchCopilotConfig(): Promise<CopilotConfig> {
  const res = await fetch(`${API_BASE}/copilot/config`);
  if (!res.ok) throw new Error('Failed to fetch copilot config');
  return res.json();
}

async function fetchCopilotModels(): Promise<{ models: CopilotModel[]; current: string }> {
  const res = await fetch(`${API_BASE}/copilot/models`);
  if (!res.ok) throw new Error('Failed to fetch copilot models');
  return res.json();
}

async function updateCopilotConfig(config: Partial<CopilotConfig>): Promise<{ success: boolean }> {
  const res = await fetch(`${API_BASE}/copilot/config`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  });
  if (!res.ok) throw new Error('Failed to update copilot config');
  return res.json();
}

async function startCopilotAuth(): Promise<{ success: boolean; error?: string }> {
  const res = await fetch(`${API_BASE}/copilot/auth/start`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to start auth');
  return res.json();
}

async function startCopilotDaemon(): Promise<{ success: boolean; pid?: number; error?: string }> {
  const res = await fetch(`${API_BASE}/copilot/daemon/start`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to start daemon');
  return res.json();
}

async function stopCopilotDaemon(): Promise<{ success: boolean; error?: string }> {
  const res = await fetch(`${API_BASE}/copilot/daemon/stop`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to stop daemon');
  return res.json();
}

// Hook
export function useCopilot() {
  const queryClient = useQueryClient();

  // Queries
  const statusQuery = useQuery({
    queryKey: ['copilot-status'],
    queryFn: fetchCopilotStatus,
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  const configQuery = useQuery({
    queryKey: ['copilot-config'],
    queryFn: fetchCopilotConfig,
  });

  const modelsQuery = useQuery({
    queryKey: ['copilot-models'],
    queryFn: fetchCopilotModels,
  });

  // Mutations
  const updateConfigMutation = useMutation({
    mutationFn: updateCopilotConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['copilot-status'] });
      queryClient.invalidateQueries({ queryKey: ['copilot-config'] });
    },
  });

  const startAuthMutation = useMutation({
    mutationFn: startCopilotAuth,
    onSuccess: () => {
      // Delay refetch to allow auth to complete
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['copilot-status'] });
      }, 2000);
    },
  });

  const startDaemonMutation = useMutation({
    mutationFn: startCopilotDaemon,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['copilot-status'] });
    },
  });

  const stopDaemonMutation = useMutation({
    mutationFn: stopCopilotDaemon,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['copilot-status'] });
    },
  });

  return {
    // Status
    status: statusQuery.data,
    statusLoading: statusQuery.isLoading,
    statusError: statusQuery.error,
    refetchStatus: statusQuery.refetch,

    // Config
    config: configQuery.data,
    configLoading: configQuery.isLoading,

    // Models
    models: modelsQuery.data?.models ?? [],
    currentModel: modelsQuery.data?.current,
    modelsLoading: modelsQuery.isLoading,

    // Mutations
    updateConfig: updateConfigMutation.mutate,
    updateConfigAsync: updateConfigMutation.mutateAsync,
    isUpdating: updateConfigMutation.isPending,

    startAuth: startAuthMutation.mutate,
    isAuthenticating: startAuthMutation.isPending,

    startDaemon: startDaemonMutation.mutate,
    isStartingDaemon: startDaemonMutation.isPending,

    stopDaemon: stopDaemonMutation.mutate,
    isStoppingDaemon: stopDaemonMutation.isPending,
  };
}
