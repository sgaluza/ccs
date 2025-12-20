/**
 * OpenRouter Badge Component
 * Visual indicator for OpenRouter-configured profiles
 */

import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface OpenRouterBadgeProps {
  className?: string;
  showTooltip?: boolean;
}

export function OpenRouterBadge({ className, showTooltip = true }: OpenRouterBadgeProps) {
  const badge = (
    <Badge
      variant="outline"
      className={cn(
        'bg-orange-50 border-orange-200 text-orange-700',
        'dark:bg-orange-950 dark:border-orange-800 dark:text-orange-300',
        className
      )}
    >
      <img src="/icons/openrouter.svg" alt="OpenRouter" className="mr-1 h-3 w-3" />
      OpenRouter
    </Badge>
  );

  if (!showTooltip) return badge;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{badge}</TooltipTrigger>
      <TooltipContent>
        <p>Access 349+ models via OpenRouter</p>
      </TooltipContent>
    </Tooltip>
  );
}
