/**
 * Copilot Config Form
 *
 * Form for configuring GitHub Copilot integration settings.
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCopilot } from '@/hooks/use-copilot';
import { Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';

export function CopilotConfigForm() {
  const { config, configLoading, models, modelsLoading, updateConfigAsync, isUpdating } =
    useCopilot();

  // Track local overrides for form fields
  const [localOverrides, setLocalOverrides] = useState<{
    enabled?: boolean;
    autoStart?: boolean;
    port?: number;
    accountType?: 'individual' | 'business' | 'enterprise';
    model?: string;
    rateLimit?: string;
    waitOnLimit?: boolean;
  }>({});

  // Use local overrides if set, otherwise use config values
  const enabled = localOverrides.enabled ?? config?.enabled ?? false;
  const autoStart = localOverrides.autoStart ?? config?.auto_start ?? false;
  const port = localOverrides.port ?? config?.port ?? 4141;
  const accountType = localOverrides.accountType ?? config?.account_type ?? 'individual';
  const model = localOverrides.model ?? config?.model ?? 'claude-opus-4-5-20250514';
  const rateLimit = localOverrides.rateLimit ?? config?.rate_limit?.toString() ?? '';
  const waitOnLimit = localOverrides.waitOnLimit ?? config?.wait_on_limit ?? true;

  const updateField = <K extends keyof typeof localOverrides>(
    key: K,
    value: (typeof localOverrides)[K]
  ) => {
    setLocalOverrides((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    try {
      await updateConfigAsync({
        enabled,
        auto_start: autoStart,
        port,
        account_type: accountType,
        model,
        rate_limit: rateLimit ? parseInt(rateLimit, 10) : null,
        wait_on_limit: waitOnLimit,
      });
      // Clear local overrides after successful save
      setLocalOverrides({});
      toast.success('Copilot configuration has been updated.');
    } catch {
      toast.error('Failed to save settings.');
    }
  };

  if (configLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Configuration</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuration</CardTitle>
        <CardDescription>Configure GitHub Copilot integration settings</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Enable Toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="enabled">Enable Copilot</Label>
            <p className="text-sm text-muted-foreground">
              Allow using GitHub Copilot subscription with Claude Code
            </p>
          </div>
          <Switch
            id="enabled"
            checked={enabled}
            onCheckedChange={(v) => updateField('enabled', v)}
          />
        </div>

        {/* Port */}
        <div className="space-y-2">
          <Label htmlFor="port">Port</Label>
          <Input
            id="port"
            type="number"
            value={port}
            onChange={(e) => updateField('port', parseInt(e.target.value, 10))}
            min={1024}
            max={65535}
          />
          <p className="text-sm text-muted-foreground">
            Local port for copilot-api proxy (default: 4141)
          </p>
        </div>

        {/* Account Type */}
        <div className="space-y-2">
          <Label htmlFor="account-type">Account Type</Label>
          <Select
            value={accountType}
            onValueChange={(v) => updateField('accountType', v as typeof accountType)}
          >
            <SelectTrigger id="account-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="individual">Individual</SelectItem>
              <SelectItem value="business">Business</SelectItem>
              <SelectItem value="enterprise">Enterprise</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">Your GitHub Copilot subscription type</p>
        </div>

        {/* Model */}
        <div className="space-y-2">
          <Label htmlFor="model">Model</Label>
          <Select value={model} onValueChange={(v) => updateField('model', v)}>
            <SelectTrigger id="model">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {modelsLoading ? (
                <SelectItem value={model} disabled>
                  Loading...
                </SelectItem>
              ) : (
                models.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name} ({m.provider})
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">
            Model to use via Copilot (default: Claude Opus 4.5)
          </p>
        </div>

        {/* Rate Limit */}
        <div className="space-y-2">
          <Label htmlFor="rate-limit">Rate Limit (seconds)</Label>
          <Input
            id="rate-limit"
            type="number"
            value={rateLimit}
            onChange={(e) => updateField('rateLimit', e.target.value)}
            placeholder="No limit"
            min={0}
          />
          <p className="text-sm text-muted-foreground">
            Minimum seconds between requests (leave empty for no limit)
          </p>
        </div>

        {/* Wait on Limit */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="wait-on-limit">Wait on Rate Limit</Label>
            <p className="text-sm text-muted-foreground">
              Wait instead of error when rate limit is hit
            </p>
          </div>
          <Switch
            id="wait-on-limit"
            checked={waitOnLimit}
            onCheckedChange={(v) => updateField('waitOnLimit', v)}
          />
        </div>

        {/* Auto Start */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="auto-start">Auto-start Daemon</Label>
            <p className="text-sm text-muted-foreground">
              Automatically start copilot-api when using profile
            </p>
          </div>
          <Switch
            id="auto-start"
            checked={autoStart}
            onCheckedChange={(v) => updateField('autoStart', v)}
          />
        </div>

        {/* Save Button */}
        <Button onClick={handleSave} disabled={isUpdating} className="w-full">
          {isUpdating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
