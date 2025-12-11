/**
 * Model Preferences Grid Component
 * Model selection per provider for CLIProxy Overview tab
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { useCliproxyModels, useUpdateModel } from '@/hooks/use-cliproxy';

interface ProviderModelSelectProps {
  provider: string;
  displayName: string;
  currentModel: string;
  availableModels: string[];
  onModelChange: (model: string) => void;
  isUpdating: boolean;
}

function ProviderIcon({ provider }: { provider: string }) {
  const colors: Record<string, string> = {
    claude: 'bg-orange-500',
    gemini: 'bg-blue-500',
    codex: 'bg-green-500',
    agy: 'bg-purple-500',
  };
  return <div className={`w-3 h-3 rounded-full ${colors[provider] ?? 'bg-gray-500'}`} />;
}

function ProviderModelSelect({
  provider,
  displayName,
  currentModel,
  availableModels,
  onModelChange,
  isUpdating,
}: ProviderModelSelectProps) {
  return (
    <div className="flex items-center justify-between p-3 border rounded-lg">
      <div className="flex items-center gap-2">
        <ProviderIcon provider={provider} />
        <span className="font-medium">{displayName}</span>
      </div>
      <div className="flex items-center gap-2">
        {isUpdating && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
        <Select
          value={currentModel}
          onValueChange={onModelChange}
          disabled={isUpdating || availableModels.length === 0}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue
              placeholder={availableModels.length === 0 ? 'No models available' : 'Select model'}
            />
          </SelectTrigger>
          <SelectContent>
            {availableModels.map((model) => (
              <SelectItem key={model} value={model}>
                {model}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

function ModelPreferencesSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Model Preferences</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-14 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function ModelPreferencesGrid() {
  const { data: modelsData, isLoading } = useCliproxyModels();
  const updateModel = useUpdateModel();

  const providers = [
    { id: 'claude', displayName: 'Claude' },
    { id: 'gemini', displayName: 'Gemini' },
    { id: 'codex', displayName: 'Codex' },
    { id: 'agy', displayName: 'Agy' },
  ];

  if (isLoading) {
    return <ModelPreferencesSkeleton />;
  }

  const getProviderModels = (providerId: string) => {
    const providerData = modelsData?.providers?.[providerId];
    return {
      current: providerData?.currentModel ?? '',
      available: providerData?.availableModels ?? [],
    };
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Model Preferences</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {providers.map((p) => {
            const models = getProviderModels(p.id);
            return (
              <ProviderModelSelect
                key={p.id}
                provider={p.id}
                displayName={p.displayName}
                currentModel={models.current}
                availableModels={models.available}
                onModelChange={(model) => updateModel.mutate({ provider: p.id, model })}
                isUpdating={updateModel.isPending && updateModel.variables?.provider === p.id}
              />
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
