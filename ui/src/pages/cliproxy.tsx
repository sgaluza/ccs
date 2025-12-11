/**
 * CLIProxy Page - Master-Detail Layout
 * Left sidebar: Provider navigation + Quick actions
 * Right panel: Provider details, accounts, preferences
 */

import { useState, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  Check,
  X,
  User,
  Star,
  Trash2,
  Sparkles,
  RefreshCw,
  Settings,
  FileText,
  Terminal,
  Zap,
  Shield,
  Clock,
  MoreHorizontal,
} from 'lucide-react';
import { QuickSetupWizard } from '@/components/quick-setup-wizard';
import { AddAccountDialog } from '@/components/add-account-dialog';
import { ConfigSplitView } from '@/components/cliproxy/config/config-split-view';
import { LogViewer } from '@/components/cliproxy/logs/log-viewer';
import {
  useCliproxy,
  useCliproxyAuth,
  useSetDefaultAccount,
  useRemoveAccount,
  useCliproxyModels,
  useUpdateModel,
} from '@/hooks/use-cliproxy';
import { useCliproxyStats } from '@/hooks/use-cliproxy-stats';
import type { OAuthAccount, AuthStatus } from '@/lib/api-client';
import { cn } from '@/lib/utils';

type ViewMode = 'overview' | 'config' | 'logs';

// Provider icon component
function ProviderIcon({ provider, className }: { provider: string; className?: string }) {
  const iconMap: Record<string, { bg: string; text: string; letter: string }> = {
    gemini: { bg: 'bg-blue-500/10', text: 'text-blue-600', letter: 'G' },
    claude: { bg: 'bg-orange-500/10', text: 'text-orange-600', letter: 'C' },
    codex: { bg: 'bg-green-500/10', text: 'text-green-600', letter: 'X' },
    agy: { bg: 'bg-purple-500/10', text: 'text-purple-600', letter: 'A' },
  };
  const config = iconMap[provider.toLowerCase()] || {
    bg: 'bg-gray-500/10',
    text: 'text-gray-600',
    letter: provider[0]?.toUpperCase() || '?',
  };

  return (
    <div
      className={cn(
        'flex items-center justify-center w-8 h-8 rounded-lg font-semibold text-sm',
        config.bg,
        config.text,
        className
      )}
    >
      {config.letter}
    </div>
  );
}

// Sidebar provider item
function ProviderSidebarItem({
  status,
  isSelected,
  onSelect,
}: {
  status: AuthStatus;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const accountCount = status.accounts?.length || 0;

  return (
    <button
      className={cn(
        'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors cursor-pointer text-left',
        isSelected
          ? 'bg-primary/10 border border-primary/20'
          : 'hover:bg-muted border border-transparent'
      )}
      onClick={onSelect}
    >
      <ProviderIcon provider={status.provider} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm truncate">{status.displayName}</span>
          {accountCount > 0 && (
            <Badge variant="secondary" className="text-[10px] h-4 px-1">
              {accountCount}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          {status.authenticated ? (
            <>
              <Check className="w-3 h-3 text-green-600" />
              <span className="text-xs text-green-600">Connected</span>
            </>
          ) : (
            <>
              <X className="w-3 h-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Not connected</span>
            </>
          )}
        </div>
      </div>
    </button>
  );
}

// Quick action item in sidebar
function QuickActionItem({
  icon: Icon,
  label,
  isActive,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={cn(
        'w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors cursor-pointer text-left text-sm',
        isActive ? 'bg-muted font-medium' : 'hover:bg-muted/50 text-muted-foreground'
      )}
      onClick={onClick}
    >
      <Icon className="w-4 h-4" />
      <span>{label}</span>
    </button>
  );
}

// Account badge with actions
function AccountBadge({
  account,
  onSetDefault,
  onRemove,
  isRemoving,
}: {
  account: OAuthAccount;
  onSetDefault: () => void;
  onRemove: () => void;
  isRemoving: boolean;
}) {
  return (
    <div
      className={cn(
        'flex items-center justify-between p-3 rounded-lg border transition-colors',
        account.isDefault ? 'border-primary/30 bg-primary/5' : 'border-border hover:bg-muted/30'
      )}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            'flex items-center justify-center w-8 h-8 rounded-full',
            account.isDefault ? 'bg-primary/10' : 'bg-muted'
          )}
        >
          <User className="w-4 h-4" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">{account.email || account.id}</span>
            {account.isDefault && (
              <Badge variant="secondary" className="text-[10px] h-4 px-1.5 gap-0.5">
                <Star className="w-2.5 h-2.5 fill-current" />
                Default
              </Badge>
            )}
          </div>
          {account.lastUsedAt && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
              <Clock className="w-3 h-3" />
              Last used: {new Date(account.lastUsedAt).toLocaleDateString()}
            </div>
          )}
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-7 w-7">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {!account.isDefault && (
            <DropdownMenuItem onClick={onSetDefault}>
              <Star className="w-4 h-4 mr-2" />
              Set as default
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={onRemove}
            disabled={isRemoving}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            {isRemoving ? 'Removing...' : 'Remove account'}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

// Provider detail panel
function ProviderDetailPanel({
  status,
  onAddAccount,
}: {
  status: AuthStatus;
  onAddAccount: () => void;
}) {
  const setDefaultMutation = useSetDefaultAccount();
  const removeMutation = useRemoveAccount();
  const { data: modelsData } = useCliproxyModels();
  const updateModelMutation = useUpdateModel();
  const { data: statsData } = useCliproxyStats();

  const accounts = status.accounts || [];
  const providerData = modelsData?.providers?.[status.provider];
  const providerModels = providerData?.availableModels || [];
  const currentModel = providerData?.currentModel;

  // Get stats for this provider
  const providerRequestCount = useMemo(() => {
    if (!statsData?.requestsByProvider) return null;
    return statsData.requestsByProvider[status.provider] ?? null;
  }, [statsData, status.provider]);

  return (
    <div className="flex-1 flex flex-col min-w-0 p-6 overflow-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <ProviderIcon provider={status.provider} className="w-12 h-12 text-lg" />
          <div>
            <h2 className="text-xl font-semibold">{status.displayName}</h2>
            <div className="flex items-center gap-2 mt-1">
              {status.authenticated ? (
                <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                  <Shield className="w-3 h-3 mr-1" />
                  Authenticated
                </Badge>
              ) : (
                <Badge variant="outline" className="text-muted-foreground">
                  <X className="w-3 h-3 mr-1" />
                  Not connected
                </Badge>
              )}
              {providerRequestCount !== null && providerRequestCount > 0 && (
                <Badge variant="secondary" className="text-xs">
                  <Zap className="w-3 h-3 mr-1" />
                  {providerRequestCount.toLocaleString()} requests
                </Badge>
              )}
            </div>
          </div>
        </div>

        <Button onClick={onAddAccount} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Account
        </Button>
      </div>

      {/* Model Preference */}
      <Card className="mb-4">
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Model Preference
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 pt-0">
          <div className="flex items-center gap-4">
            <Select
              value={currentModel || ''}
              onValueChange={(value) => {
                updateModelMutation.mutate({ provider: status.provider, model: value });
              }}
              disabled={updateModelMutation.isPending}
            >
              <SelectTrigger className="w-[280px]">
                <SelectValue placeholder="Select preferred model" />
              </SelectTrigger>
              <SelectContent>
                {providerModels.map((model: string) => (
                  <SelectItem key={model} value={model}>
                    {model}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {updateModelMutation.isPending && (
              <span className="text-xs text-muted-foreground">Updating...</span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Accounts */}
      <Card className="flex-1">
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-sm font-medium flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Accounts
              {accounts.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {accounts.length}
                </Badge>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 pt-0">
          {accounts.length > 0 ? (
            <div className="space-y-2">
              {accounts.map((account) => (
                <AccountBadge
                  key={account.id}
                  account={account}
                  onSetDefault={() =>
                    setDefaultMutation.mutate({
                      provider: status.provider,
                      accountId: account.id,
                    })
                  }
                  onRemove={() =>
                    removeMutation.mutate({
                      provider: status.provider,
                      accountId: account.id,
                    })
                  }
                  isRemoving={removeMutation.isPending}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                <User className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                {status.authenticated
                  ? 'No specific accounts tracked'
                  : 'Connect an account to get started'}
              </p>
              <Button variant="outline" size="sm" onClick={onAddAccount} className="gap-2">
                <Plus className="w-4 h-4" />
                Add Account
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Empty state for right panel
function EmptyProviderState({ onSetup }: { onSetup: () => void }) {
  return (
    <div className="flex-1 flex items-center justify-center bg-muted/20">
      <div className="text-center max-w-md px-8">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
          <Zap className="w-8 h-8 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-semibold mb-2">CLIProxy Manager</h2>
        <p className="text-muted-foreground mb-6">
          Manage OAuth authentication for Claude CLI proxy providers. Select a provider from the
          sidebar or run the quick setup wizard.
        </p>
        <Button onClick={onSetup} className="gap-2">
          <Sparkles className="w-4 h-4" />
          Quick Setup
        </Button>
      </div>
    </div>
  );
}

export function CliproxyPage() {
  const queryClient = useQueryClient();
  const { data: authData, isLoading: authLoading } = useCliproxyAuth();
  const { isFetching } = useCliproxy();

  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('overview');
  const [wizardOpen, setWizardOpen] = useState(false);
  const [addAccountProvider, setAddAccountProvider] = useState<{
    provider: string;
    displayName: string;
  } | null>(null);

  // Auto-select first provider if none selected
  const providers = authData?.authStatus || [];
  const effectiveProvider = useMemo(() => {
    if (selectedProvider && providers.some((p) => p.provider === selectedProvider)) {
      return selectedProvider;
    }
    return providers.length > 0 ? providers[0].provider : null;
  }, [selectedProvider, providers]);

  const selectedStatus = providers.find((p) => p.provider === effectiveProvider);

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['cliproxy'] });
    queryClient.invalidateQueries({ queryKey: ['cliproxy-auth'] });
  };

  return (
    <div className="h-[calc(100vh-100px)] flex">
      {/* Left Sidebar */}
      <div className="w-64 border-r flex flex-col bg-muted/30">
        {/* Header */}
        <div className="p-4 border-b bg-background">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              <h1 className="font-semibold">CLIProxy</h1>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleRefresh}
              disabled={isFetching}
            >
              <RefreshCw className={cn('w-4 h-4', isFetching && 'animate-spin')} />
            </Button>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="w-full gap-2"
            onClick={() => setWizardOpen(true)}
          >
            <Sparkles className="w-4 h-4" />
            Quick Setup
          </Button>
        </div>

        {/* Providers List */}
        <ScrollArea className="flex-1">
          <div className="p-2">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide px-3 py-2">
              Providers
            </div>
            {authLoading ? (
              <div className="space-y-2 px-2">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-14 w-full rounded-lg" />
                ))}
              </div>
            ) : (
              <div className="space-y-1">
                {providers.map((status) => (
                  <ProviderSidebarItem
                    key={status.provider}
                    status={status}
                    isSelected={effectiveProvider === status.provider && viewMode === 'overview'}
                    onSelect={() => {
                      setSelectedProvider(status.provider);
                      setViewMode('overview');
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          <Separator className="my-2" />

          {/* Quick Actions */}
          <div className="p-2">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide px-3 py-2">
              Tools
            </div>
            <div className="space-y-1">
              <QuickActionItem
                icon={FileText}
                label="Config Editor"
                isActive={viewMode === 'config'}
                onClick={() => setViewMode('config')}
              />
              <QuickActionItem
                icon={Terminal}
                label="Logs"
                isActive={viewMode === 'logs'}
                onClick={() => setViewMode('logs')}
              />
            </div>
          </div>
        </ScrollArea>

        {/* Footer Stats */}
        <div className="p-3 border-t bg-background text-xs text-muted-foreground">
          <div className="flex items-center justify-between">
            <span>
              {providers.length} provider{providers.length !== 1 ? 's' : ''}
            </span>
            <span className="flex items-center gap-1">
              <Check className="w-3 h-3 text-green-600" />
              {providers.filter((p) => p.authenticated).length} connected
            </span>
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex flex-col min-w-0 bg-background">
        {viewMode === 'config' ? (
          <div className="flex-1 p-4">
            <ConfigSplitView />
          </div>
        ) : viewMode === 'logs' ? (
          <div className="flex-1 p-4">
            <LogViewer />
          </div>
        ) : selectedStatus ? (
          <ProviderDetailPanel
            status={selectedStatus}
            onAddAccount={() =>
              setAddAccountProvider({
                provider: selectedStatus.provider,
                displayName: selectedStatus.displayName,
              })
            }
          />
        ) : (
          <EmptyProviderState onSetup={() => setWizardOpen(true)} />
        )}
      </div>

      {/* Dialogs */}
      <QuickSetupWizard open={wizardOpen} onClose={() => setWizardOpen(false)} />
      <AddAccountDialog
        open={addAccountProvider !== null}
        onClose={() => setAddAccountProvider(null)}
        provider={addAccountProvider?.provider || ''}
        displayName={addAccountProvider?.displayName || ''}
      />
    </div>
  );
}
