import { AlertTriangle, Image as ImageIcon, Route } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { ImageAnalysisStatus } from '@/lib/api-client';

interface ImageAnalysisStatusSectionProps {
  status?: ImageAnalysisStatus | null;
  source?: 'saved' | 'editor';
  previewState?: 'saved' | 'preview' | 'refreshing' | 'invalid';
}

function getBadge(status: ImageAnalysisStatus | null | undefined) {
  if (!status) return { label: 'Checking', variant: 'outline' as const };
  if (status.status === 'disabled') return { label: 'Disabled', variant: 'outline' as const };
  if (status.status === 'hook-missing')
    return { label: 'Setup needed', variant: 'destructive' as const };
  if (status.authReadiness === 'missing')
    return { label: 'Needs auth', variant: 'destructive' as const };
  if (status.proxyReadiness === 'unavailable')
    return { label: 'Needs proxy', variant: 'destructive' as const };
  if (
    status.effectiveRuntimeMode === 'cliproxy-image-analysis' &&
    status.proxyReadiness === 'stopped'
  ) {
    return { label: 'Starts on launch', variant: 'secondary' as const };
  }
  if (status.effectiveRuntimeMode === 'cliproxy-image-analysis') {
    return {
      label: status.resolutionSource === 'profile-backend' ? 'Ready via mapping' : 'Ready',
      variant: 'default' as const,
    };
  }
  if (
    status.authReadiness === 'unknown' ||
    status.proxyReadiness === 'unknown' ||
    status.status === 'attention'
  ) {
    return { label: 'Needs review', variant: 'outline' as const };
  }
  if (status.status === 'skipped' && status.reason?.includes('native file access')) {
    return { label: 'Native Claude', variant: 'secondary' as const };
  }
  return { label: 'Native Read', variant: 'outline' as const };
}

function getSummary(status: ImageAnalysisStatus): string {
  const backendName = status.backendDisplayName || status.backendId || 'this backend';

  if (status.status === 'disabled') {
    return "Disabled globally. This profile uses Claude's built-in file reading because CCS image analysis is turned off.";
  }

  if (!status.backendId) {
    return status.reason || "This profile uses Claude's built-in file reading.";
  }

  if (status.status === 'hook-missing') {
    return `Configured for ${backendName}, but ${status.reason || 'the image-analysis hook is not fully installed yet.'}`;
  }

  if (status.effectiveRuntimeMode === 'native-read') {
    return `Configured via ${backendName}, but ${status.effectiveRuntimeReason || status.reason || 'runtime readiness could not be confirmed.'}`;
  }

  if (status.proxyReadiness === 'stopped') {
    return `Configured via ${backendName}. Auth is ready and CCS will start the local CLIProxy runtime on launch, so image and PDF reads still use CLIProxy.`;
  }

  if (status.resolutionSource === 'profile-backend') {
    return `Configured via saved ${backendName} mapping. Auth and runtime are ready, so image and PDF reads use CLIProxy.`;
  }

  if (status.status === 'attention' && status.reason) {
    return `Configured via ${backendName}. Image and PDF reads use CLIProxy, but ${status.reason}`;
  }

  return `Configured via ${backendName}. Image and PDF reads use CLIProxy for this profile.`;
}

function getRuntimeLine(status: ImageAnalysisStatus): string {
  if (status.effectiveRuntimeMode === 'native-read') {
    return 'Read -> native file access';
  }

  if (status.proxyReadiness === 'stopped') {
    return 'Read -> image-analysis hook -> start local CLIProxy';
  }

  if (status.proxyReadiness === 'remote') {
    return 'Read -> image-analysis hook -> remote CLIProxy';
  }

  return `Read -> image-analysis hook -> ${status.runtimePath || 'CLIProxy'}`;
}

function getAuthLine(status: ImageAnalysisStatus): string {
  if (status.authReadiness === 'not-needed') return 'Not required';
  if (status.authReadiness === 'ready')
    return `${status.authDisplayName || status.authProvider} ready`;
  return status.authReason || 'Auth readiness could not be verified.';
}

function getProxyLine(status: ImageAnalysisStatus): string {
  if (status.proxyReadiness === 'not-needed') return 'Not required';
  if (status.proxyReadiness === 'ready') return 'Local CLIProxy ready';
  if (status.proxyReadiness === 'remote') return status.proxyReason || 'Remote CLIProxy ready';
  if (status.proxyReadiness === 'stopped') return 'Local CLIProxy idle; starts on launch';
  return status.proxyReason || 'CLIProxy runtime readiness could not be verified.';
}

function getStatusContext(
  source: 'saved' | 'editor',
  previewState: ImageAnalysisStatusSectionProps['previewState']
): string {
  if (previewState === 'invalid') {
    return 'Showing last saved runtime status. The live preview resumes when the JSON above is valid again.';
  }
  if (previewState === 'refreshing') {
    return 'Refreshing the live preview from the current editor state.';
  }
  if (source === 'editor') {
    return 'Live preview from the current editor state. Save to persist config changes; auth and proxy readiness stay derived below.';
  }
  return 'Saved runtime status for this profile. Config stays in the JSON editor above; auth and proxy readiness are derived at runtime.';
}

function getPersistenceLine(status: ImageAnalysisStatus): string {
  if (!status.shouldPersistHook || !status.persistencePath)
    return 'Not persisted for this profile type';
  return status.hookInstalled
    ? `${status.persistencePath} hook`
    : `${status.persistencePath} hook missing`;
}

export function ImageAnalysisStatusSection({
  status,
  source = 'saved',
  previewState = 'saved',
}: ImageAnalysisStatusSectionProps) {
  if (!status) {
    return (
      <div className="rounded-md border bg-muted/20 p-4" aria-live="polite">
        <div className="h-4 w-44 animate-pulse rounded bg-muted" />
        <div className="mt-2 h-3 w-72 animate-pulse rounded bg-muted" />
        <p className="mt-3 text-sm text-muted-foreground">Checking backend status...</p>
      </div>
    );
  }

  const badge = getBadge(status);
  const notice =
    status.effectiveRuntimeMode === 'native-read'
      ? status.effectiveRuntimeReason
      : status.status === 'attention' || status.status === 'hook-missing'
        ? status.reason
        : null;

  return (
    <section className="rounded-md border bg-muted/20 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4 text-sky-600" />
            <h3 className="text-sm font-semibold">Image-analysis backend</h3>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {getStatusContext(source, previewState)}
          </p>
        </div>
        <Badge variant={badge.variant} className="shrink-0 text-[11px]">
          {badge.label}
        </Badge>
      </div>

      <p aria-live="polite" className="mt-3 text-sm leading-6 text-muted-foreground">
        {getSummary(status)}
      </p>

      <dl className="mt-4 grid gap-x-4 gap-y-3 sm:grid-cols-2">
        <div className="space-y-1">
          <dt className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Backend
          </dt>
          <dd className="text-sm font-medium">{status.backendDisplayName || 'Unresolved'}</dd>
        </div>
        <div className="space-y-1">
          <dt className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Runtime
          </dt>
          <dd
            className="font-mono text-xs leading-5 text-foreground"
            title={getRuntimeLine(status)}
          >
            {getRuntimeLine(status)}
          </dd>
        </div>
        <div className="space-y-1">
          <dt className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Auth
          </dt>
          <dd className="text-sm text-foreground">{getAuthLine(status)}</dd>
        </div>
        <div className="space-y-1">
          <dt className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Proxy
          </dt>
          <dd className="text-sm text-foreground">{getProxyLine(status)}</dd>
        </div>
        <div className="space-y-1">
          <dt className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Persistence
          </dt>
          <dd
            className="font-mono text-xs leading-5 text-foreground"
            title={status.persistencePath || 'Not persisted'}
          >
            {getPersistenceLine(status)}
          </dd>
        </div>
        <div className="space-y-1">
          <dt className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Model
          </dt>
          <dd className={cn('text-sm text-foreground', status.model && 'font-mono text-xs')}>
            {status.model || status.reason || 'Unavailable'}
          </dd>
        </div>
      </dl>

      {notice && (
        <div className="mt-4 flex items-start gap-2 rounded-md border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-sm text-amber-900 dark:text-amber-200">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
          <span>{notice}</span>
        </div>
      )}

      <div className="mt-4 flex items-center gap-2 border-t border-border/60 pt-3 text-xs text-muted-foreground">
        <Route className="h-3.5 w-3.5" />
        <span>
          WebSearch stays managed separately and is not controlled by this backend status.
        </span>
      </div>
    </section>
  );
}
