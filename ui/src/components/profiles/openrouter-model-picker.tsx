/**
 * OpenRouter Model Picker Component
 * Searchable model selector with categories and pricing
 */

import { useState, useMemo, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, RefreshCw, Loader2 } from 'lucide-react';
import { useOpenRouterCatalog, useRefreshOpenRouterModels } from '@/hooks/use-openrouter-models';
import {
  searchModels,
  formatPricingPair,
  formatContextLength,
  CATEGORY_LABELS,
} from '@/lib/openrouter-utils';
import type { CategorizedModel, ModelCategory } from '@/lib/openrouter-types';
import { cn } from '@/lib/utils';

interface OpenRouterModelPickerProps {
  value?: string;
  onChange: (modelId: string) => void;
  placeholder?: string;
  className?: string;
}

export function OpenRouterModelPicker({
  value,
  onChange,
  placeholder = 'Search models...',
  className,
}: OpenRouterModelPickerProps) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ModelCategory | null>(null);

  const { models, isLoading, isError, isFetching } = useOpenRouterCatalog();
  const refreshModels = useRefreshOpenRouterModels();

  // Filter and group models
  const filteredModels = useMemo(() => {
    return searchModels(models, search, {
      category: selectedCategory ?? undefined,
    });
  }, [models, search, selectedCategory]);

  // Group by category
  const groupedModels = useMemo(() => {
    const groups: Record<ModelCategory, CategorizedModel[]> = {
      anthropic: [],
      openai: [],
      google: [],
      meta: [],
      mistral: [],
      opensource: [],
      other: [],
    };

    filteredModels.forEach((model) => {
      groups[model.category].push(model);
    });

    return groups;
  }, [filteredModels]);

  const handleRefresh = useCallback(() => {
    refreshModels();
  }, [refreshModels]);

  const selectedModel = models.find((m) => m.id === value);

  if (isLoading && models.length === 0) {
    return (
      <div className={cn('space-y-2', className)}>
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className={cn('space-y-2', className)}>
      {/* Search Header */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={placeholder}
            className="pl-9"
          />
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={handleRefresh}
          disabled={isFetching}
          title="Refresh models"
        >
          {isFetching ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Category Filters */}
      <div className="flex flex-wrap gap-1">
        <Badge
          variant={selectedCategory === null ? 'default' : 'outline'}
          className="cursor-pointer"
          onClick={() => setSelectedCategory(null)}
        >
          All ({models.length})
        </Badge>
        {(Object.keys(CATEGORY_LABELS) as ModelCategory[]).map((cat) => {
          const count = groupedModels[cat].length;
          if (count === 0) return null;
          return (
            <Badge
              key={cat}
              variant={selectedCategory === cat ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setSelectedCategory(cat)}
            >
              {CATEGORY_LABELS[cat]} ({count})
            </Badge>
          );
        })}
      </div>

      {/* Selected Model Display */}
      {selectedModel && (
        <div className="bg-muted rounded-md p-2 text-sm">
          <span className="font-medium">{selectedModel.name}</span>
          <span className="text-muted-foreground ml-2">
            {formatPricingPair(selectedModel.pricing)} |{' '}
            {formatContextLength(selectedModel.context_length)}
          </span>
        </div>
      )}

      {/* Model List */}
      <ScrollArea className="h-64 rounded-md border">
        {isError ? (
          <div className="text-destructive p-4 text-center">
            Failed to load models.{' '}
            <Button variant="link" onClick={handleRefresh}>
              Retry
            </Button>
          </div>
        ) : filteredModels.length === 0 ? (
          <div className="text-muted-foreground p-4 text-center">
            No models found matching &quot;{search}&quot;
          </div>
        ) : (
          <div className="space-y-4 p-2">
            {(Object.keys(CATEGORY_LABELS) as ModelCategory[]).map((category) => {
              const categoryModels = groupedModels[category];
              if (categoryModels.length === 0) return null;

              return (
                <div key={category}>
                  <div className="text-muted-foreground bg-background sticky top-0 mb-1 py-1 text-xs font-semibold">
                    {CATEGORY_LABELS[category]}
                  </div>
                  {categoryModels.map((model) => (
                    <ModelItem
                      key={model.id}
                      model={model}
                      isSelected={model.id === value}
                      onClick={() => onChange(model.id)}
                    />
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

function ModelItem({
  model,
  isSelected,
  onClick,
}: {
  model: CategorizedModel;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'hover:bg-accent flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-left text-sm',
        isSelected && 'bg-accent'
      )}
    >
      <span className="flex-1 truncate">{model.name}</span>
      <span className="text-muted-foreground ml-2 flex items-center gap-2 text-xs">
        {model.isFree ? (
          <Badge variant="secondary" className="text-xs">
            Free
          </Badge>
        ) : (
          <span>{formatPricingPair(model.pricing)}</span>
        )}
        <span>{formatContextLength(model.context_length)}</span>
      </span>
    </button>
  );
}
