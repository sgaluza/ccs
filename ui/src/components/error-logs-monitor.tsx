/**
 * Error Logs Monitor Component
 *
 * Displays CLIProxyAPI error logs with master-detail split view.
 * ETL: Parses raw logs into structured data for rich display.
 * - Left panel: Log list with status code, provider, endpoint, relative time
 * - Right panel: Tabbed view (Overview, Headers, Request, Response, Raw)
 */

import { useState, useMemo, useRef, useEffect } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { useCliproxyErrorLogs, useCliproxyErrorLogContent } from '@/hooks/use-cliproxy-stats';
import { useCliproxyStatus } from '@/hooks/use-cliproxy-stats';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ProviderIcon } from '@/components/provider-icon';
import { CopyButton } from '@/components/ui/copy-button';
import {
  AlertTriangle,
  FileWarning,
  Clock,
  FileText,
  Terminal,
  Info,
  Code,
  ArrowUpRight,
  ArrowDownLeft,
  GripVertical,
  GripHorizontal,
} from 'lucide-react';
import {
  parseErrorLog,
  parseFilename,
  formatRelativeTime,
  formatBytes,
  getStatusColor,
  getErrorTypeLabel,
  type ParsedErrorLog,
} from '@/lib/error-log-parser';

type TabType = 'overview' | 'headers' | 'request' | 'response' | 'raw';

/** Tab button component */
function TabButton({
  active,
  onClick,
  children,
  icon: Icon,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'px-2.5 py-1.5 text-xs font-medium rounded transition-colors flex items-center gap-1.5',
        active
          ? 'bg-primary/15 text-primary'
          : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
      )}
    >
      {Icon && <Icon className="w-3.5 h-3.5" />}
      {children}
    </button>
  );
}

/** Status badge component */
function StatusBadge({ code }: { code: number }) {
  const colorClass = getStatusColor(code);
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center min-w-[36px] px-2 py-0.5 rounded text-xs font-bold',
        'bg-current/10 border border-current/20',
        colorClass
      )}
    >
      {code}
    </span>
  );
}

/** Overview tab content */
function OverviewTab({ parsed }: { parsed: ParsedErrorLog }) {
  return (
    <div className="p-4 space-y-4">
      {/* Status row */}
      <div className="flex items-center gap-3">
        <StatusBadge code={parsed.statusCode} />
        <span className="text-sm font-medium">{parsed.statusText}</span>
        <span className="text-xs text-muted-foreground px-2 py-0.5 rounded bg-muted/50">
          {getErrorTypeLabel(parsed.errorType)}
        </span>
      </div>

      {/* Key metrics grid */}
      <div className="grid grid-cols-4 gap-3 text-xs">
        <div className="p-2.5 rounded bg-muted/30 border border-border/50">
          <div className="text-muted-foreground mb-1">Method</div>
          <div className="font-medium">{parsed.method || 'N/A'}</div>
        </div>
        <div className="p-2.5 rounded bg-muted/30 border border-border/50">
          <div className="text-muted-foreground mb-1">Provider</div>
          <div className="font-medium">{parsed.provider || 'N/A'}</div>
        </div>
        <div className="p-2.5 rounded bg-muted/30 border border-border/50">
          <div className="text-muted-foreground mb-1">Version</div>
          <div className="font-medium">{parsed.version || 'N/A'}</div>
        </div>
        <div className="p-2.5 rounded bg-muted/30 border border-border/50">
          <div className="text-muted-foreground mb-1">Endpoint</div>
          <div className="font-medium truncate" title={parsed.endpoint}>
            {parsed.endpoint || 'N/A'}
          </div>
        </div>
      </div>

      {/* URL */}
      <div className="text-xs">
        <div className="text-muted-foreground mb-1.5">URL</div>
        <div className="font-mono p-2.5 rounded bg-muted/30 border border-border/50 break-all leading-relaxed">
          {parsed.url || 'N/A'}
        </div>
      </div>

      {/* Timestamp */}
      <div className="text-xs">
        <div className="text-muted-foreground mb-1.5">Timestamp</div>
        <div className="font-mono">{parsed.timestamp || 'N/A'}</div>
      </div>

      {/* Suggestion based on error type */}
      {parsed.errorType !== 'unknown' && (
        <div className="flex items-start gap-3 p-3 rounded bg-blue-500/10 border border-blue-500/20 text-xs">
          <Info className="w-4 h-4 mt-0.5 text-blue-500 shrink-0" />
          <div className="text-blue-500/90 leading-relaxed">
            {parsed.errorType === 'rate_limit' &&
              'Rate limited. Consider using multiple accounts or reducing request frequency.'}
            {parsed.errorType === 'auth' &&
              'Authentication failed. Check credentials or re-authenticate with the provider.'}
            {parsed.errorType === 'not_found' &&
              'Endpoint not found. This endpoint may not exist on this provider.'}
            {parsed.errorType === 'server' &&
              'Server error from upstream. Retry or check provider status.'}
            {parsed.errorType === 'timeout' &&
              'Request timed out. Check network or increase timeout settings.'}
          </div>
        </div>
      )}
    </div>
  );
}

/** Headers tab content */
function HeadersTab({ headers }: { headers: Record<string, string> }) {
  const entries = Object.entries(headers);
  if (entries.length === 0) {
    return <div className="p-4 text-xs text-muted-foreground">No headers available</div>;
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-1">
        {entries.map(([key, value]) => (
          <div
            key={key}
            className="flex gap-3 text-xs font-mono py-1.5 border-b border-border/30 last:border-0"
          >
            <span className="text-muted-foreground shrink-0 min-w-[140px]">{key}:</span>
            <span className="break-all">{value}</span>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}

/** JSON/Body tab content */
function BodyTab({ content, label }: { content: string; label: string }) {
  if (!content || content.trim() === '') {
    return <div className="p-4 text-xs text-muted-foreground">No {label.toLowerCase()} body</div>;
  }

  // Try to format as JSON
  let formatted = content;
  let isJson = false;
  try {
    const parsed = JSON.parse(content);
    formatted = JSON.stringify(parsed, null, 2);
    isJson = true;
  } catch {
    // Not JSON, use as-is
  }

  return (
    <ScrollArea className="h-full">
      <pre
        className={cn(
          'p-4 text-xs font-mono whitespace-pre-wrap break-all leading-relaxed',
          isJson
            ? 'text-emerald-700 dark:text-green-400'
            : 'text-zinc-700 dark:text-muted-foreground'
        )}
      >
        {formatted}
      </pre>
    </ScrollArea>
  );
}

/** Raw tab content */
function RawTab({ content }: { content: string }) {
  return (
    <ScrollArea className="h-full">
      <pre className="p-4 text-xs font-mono text-zinc-700 dark:text-muted-foreground whitespace-pre-wrap break-all leading-relaxed">
        {content}
      </pre>
    </ScrollArea>
  );
}

/** Log content panel with tabs */
function LogContentPanel({ name, absolutePath }: { name: string | null; absolutePath?: string }) {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const { data: content, isLoading, error } = useCliproxyErrorLogContent(name);

  // Parse log content
  const parsed = useMemo(() => {
    if (!content) return null;
    return parseErrorLog(content);
  }, [content]);

  // No log selected
  if (!name) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        <div className="text-center space-y-3">
          <Terminal className="w-10 h-10 mx-auto opacity-40" />
          <p className="text-sm">Select a log to view details</p>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex-1 p-6 space-y-3">
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-5 w-5/6" />
        <Skeleton className="h-5 w-2/3" />
      </div>
    );
  }

  // Error or no content
  if (error || !content || !parsed) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        <p className="text-sm">Failed to load log content</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-w-0 h-full">
      {/* Header with status */}
      <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <StatusBadge code={parsed.statusCode} />
          <span className="text-xs font-semibold truncate text-foreground">
            {parsed.provider}/{parsed.endpoint || 'unknown'}
          </span>
          {/* Copy Absolute Path Button */}
          {name && (
            <CopyButton
              value={absolutePath || name}
              label="Copy absolute path"
              size="icon-sm"
              className="ml-1 text-muted-foreground hover:text-foreground opacity-50 hover:opacity-100 transition-opacity"
            />
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {/* Copy Raw Content Button */}
          {content && (
            <CopyButton
              value={content}
              label="Copy raw log content"
              variant="ghost"
              size="icon-sm"
              className="text-muted-foreground hover:text-foreground"
            />
          )}
          <span className="text-[10px] text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded border border-border/50">
            {parsed.method}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-3 py-2 border-b border-border flex items-center gap-1 bg-muted/10 shrink-0 overflow-x-auto">
        <TabButton
          active={activeTab === 'overview'}
          onClick={() => setActiveTab('overview')}
          icon={Info}
        >
          Overview
        </TabButton>
        <TabButton
          active={activeTab === 'headers'}
          onClick={() => setActiveTab('headers')}
          icon={Code}
        >
          Headers
        </TabButton>
        <TabButton
          active={activeTab === 'request'}
          onClick={() => setActiveTab('request')}
          icon={ArrowUpRight}
        >
          Request
        </TabButton>
        <TabButton
          active={activeTab === 'response'}
          onClick={() => setActiveTab('response')}
          icon={ArrowDownLeft}
        >
          Response
        </TabButton>
        <TabButton active={activeTab === 'raw'} onClick={() => setActiveTab('raw')} icon={FileText}>
          Raw
        </TabButton>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-hidden bg-card/30">
        {activeTab === 'overview' && <OverviewTab parsed={parsed} />}
        {activeTab === 'headers' && <HeadersTab headers={parsed.requestHeaders} />}
        {activeTab === 'request' && <BodyTab content={parsed.requestBody} label="Request" />}
        {activeTab === 'response' && <BodyTab content={parsed.responseBody} label="Response" />}
        {activeTab === 'raw' && <RawTab content={content} />}
      </div>
    </div>
  );
}

/** Error log item in the list */
interface ErrorLogItemProps {
  name: string;
  size: number;
  modified: number;
  isSelected: boolean;
  onClick: () => void;
}

function ErrorLogItem({ name, size, modified, isSelected, onClick }: ErrorLogItemProps) {
  const parsed = useMemo(() => parseFilename(name), [name]);

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full px-3 py-2.5 flex items-start gap-3 text-left transition-colors',
        'hover:bg-muted/40 border-l-[3px]',
        isSelected ? 'bg-muted/50 border-l-amber-500' : 'border-l-transparent'
      )}
    >
      {/* Provider Icon */}
      <ProviderIcon
        provider={parsed.provider}
        size={24}
        withBackground={true}
        className="shrink-0 mt-0.5"
      />

      <div className="flex-1 min-w-0 space-y-1">
        {/* Provider / Endpoint */}
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-foreground truncate">
              {parsed.provider}
            </span>
            <span
              className={cn(
                'text-[9px] px-1 rounded border',
                isSelected
                  ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                  : 'bg-muted border-border text-muted-foreground'
              )}
            >
              LOG
            </span>
          </div>
          <span
            className="text-[11px] text-muted-foreground truncate font-medium"
            title={parsed.endpoint}
          >
            {parsed.endpoint}
          </span>
        </div>

        {/* Meta row: time + size */}
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground/80 mt-1">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatRelativeTime(modified)}
          </span>
          <span className="flex items-center gap-1">
            <FileText className="w-3 h-3" />
            {formatBytes(size)}
          </span>
        </div>
      </div>
    </button>
  );
}

export function ErrorLogsMonitor() {
  const { data: status, isLoading: isStatusLoading } = useCliproxyStatus();
  const { data: logs, isLoading, error } = useCliproxyErrorLogs(status?.running ?? false);

  // Vertical resize state
  const [height, setHeight] = useState(500);
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-scroll handler
  const stopAutoScroll = () => {
    if (scrollIntervalRef.current) {
      clearInterval(scrollIntervalRef.current);
      scrollIntervalRef.current = null;
    }
  };

  // Resize handlers
  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const containerTopDoc = rect.top + window.scrollY;
      const newHeight = e.pageY - containerTopDoc;

      // Constrain height (min 300, no max)
      setHeight(Math.max(300, newHeight));

      // Auto-scroll logic
      const viewportHeight = window.innerHeight;
      const distFromBottom = viewportHeight - e.clientY;
      const scrollSpeed = 15;

      stopAutoScroll();

      if (distFromBottom < 50) {
        scrollIntervalRef.current = setInterval(() => {
          window.scrollBy(0, scrollSpeed);
        }, 16);
      } else if (e.clientY < 50) {
        scrollIntervalRef.current = setInterval(() => {
          window.scrollBy(0, -scrollSpeed);
        }, 16);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      stopAutoScroll();
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
      stopAutoScroll();
    };
  }, [isResizing]);

  const startResizing = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  // Compute default selection (first log name or null)
  const defaultLogName = useMemo(() => logs?.[0]?.name ?? null, [logs]);

  // Use controlled selection that defaults to first log
  const [selectedLog, setSelectedLog] = useState<string | null>(null);

  // Effective selection: use user selection if available, otherwise default
  const effectiveSelection = selectedLog ?? defaultLogName;

  // Get absolute path for the selected log
  const selectedAbsolutePath = useMemo(() => {
    if (!effectiveSelection || !logs) return undefined;
    const log = logs.find((l) => l.name === effectiveSelection);
    return log?.absolutePath;
  }, [effectiveSelection, logs]);

  // Guards
  if (isStatusLoading) return null;
  if (!status?.running) return null;
  if (isLoading) {
    return (
      <div className="rounded-xl border border-border overflow-hidden font-mono text-sm bg-card/50 dark:bg-zinc-900/60 backdrop-blur-sm h-[500px]">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-20" />
        </div>
        <div className="p-4 space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }
  if (!logs || logs.length === 0) return null;

  const errorCount = logs.length;

  return (
    <div
      ref={containerRef}
      className="rounded-xl border border-border overflow-hidden font-mono text-sm text-foreground bg-card/50 dark:bg-zinc-900/60 backdrop-blur-sm flex flex-col shadow-sm transition-[height] duration-0 ease-linear relative group/container"
      style={{ height }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-gradient-to-r from-amber-500/10 via-transparent to-transparent dark:from-amber-500/15 shrink-0">
        <div className="flex items-center gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          <span className="text-sm font-semibold tracking-tight">Error Logs</span>
          <span className="text-xs text-muted-foreground ml-1">
            {errorCount} failed request{errorCount !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <FileWarning className="w-3.5 h-3.5" />
          <span>CLIProxy Diagnostics</span>
        </div>
      </div>

      {/* Resizable Panel Layout */}
      <div className="flex-1 min-h-0">
        <PanelGroup direction="horizontal">
          {/* Left Panel: Log List */}
          <Panel defaultSize={30} minSize={20} maxSize={50} className="flex flex-col min-w-0">
            <ScrollArea className="h-full">
              <div className="divide-y divide-border/50">
                {logs.slice(0, 50).map((log) => (
                  <ErrorLogItem
                    key={log.name}
                    name={log.name}
                    size={log.size}
                    modified={log.modified}
                    isSelected={effectiveSelection === log.name}
                    onClick={() => setSelectedLog(log.name)}
                  />
                ))}
              </div>
              {logs.length > 50 && (
                <div className="px-3 py-3 text-center text-[10px] text-muted-foreground border-t border-border/50">
                  Showing 50 of {logs.length} logs
                </div>
              )}
            </ScrollArea>
          </Panel>

          {/* Resize Handle */}
          <PanelResizeHandle className="w-[1px] bg-border hover:bg-primary/50 transition-colors flex items-center justify-center group relative z-10 w-2 -ml-1 flex items-center justify-center outline-none">
            <div className="w-[1px] h-full bg-border group-hover:bg-primary/50 transition-colors" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-8 rounded-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-muted border border-border">
              <GripVertical className="h-4 w-4 text-muted-foreground" />
            </div>
          </PanelResizeHandle>

          {/* Right Panel: Log Content */}
          <Panel className="flex flex-col min-w-0 bg-background/50">
            <LogContentPanel name={effectiveSelection} absolutePath={selectedAbsolutePath} />
          </Panel>
        </PanelGroup>
      </div>

      {/* Use standard footer if error, otherwise show resize handle */}
      {error ? (
        <div className="px-4 py-2 border-t border-border text-xs text-destructive bg-destructive/5 shrink-0">
          {error.message}
        </div>
      ) : (
        <div
          className="h-2 bg-border/10 border-t border-border/30 hover:bg-primary/10 transition-colors cursor-row-resize flex items-center justify-center group/handle shrink-0"
          onMouseDown={startResizing}
        >
          <GripHorizontal className="w-8 h-3 text-border group-hover:text-primary/50 transition-colors" />
        </div>
      )}
    </div>
  );
}
