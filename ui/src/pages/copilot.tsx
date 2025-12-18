/**
 * Copilot Page
 *
 * GitHub Copilot integration settings page.
 */

import { CopilotStatusCard } from '@/components/copilot/copilot-status-card';
import { CopilotConfigForm } from '@/components/copilot/copilot-config-form';

export function CopilotPage() {
  return (
    <div className="container mx-auto py-6 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold">GitHub Copilot</h1>
        <p className="text-muted-foreground">
          Use your GitHub Copilot subscription with Claude Code
        </p>
      </div>

      <CopilotStatusCard />
      <CopilotConfigForm />
    </div>
  );
}
