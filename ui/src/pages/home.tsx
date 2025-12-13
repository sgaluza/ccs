import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Key,
  Zap,
  Users,
  Search,
  Stethoscope,
  AlertTriangle,
  Terminal,
  ArrowRight,
  Command,
  Sparkles,
} from 'lucide-react';
import { useOverview } from '@/hooks/use-overview';
import { useSharedSummary } from '@/hooks/use-shared';
import { cn } from '@/lib/utils';

const HEALTH_STATUS = {
  ok: { label: 'Operational', class: 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30' },
  warning: { label: 'Degraded', class: 'bg-amber-500/20 text-amber-500 border-amber-500/30' },
  error: { label: 'Issues', class: 'bg-red-500/20 text-red-500 border-red-500/30' },
} as const;

// Three Pillars configuration - matches README branding
const THREE_PILLARS = [
  {
    id: 'api',
    title: 'API Keys',
    description: 'Configure GLM, Kimi with your own API keys',
    icon: Key,
    path: '/api',
    gradient: 'from-orange-500/20 to-amber-500/10',
    iconBg: 'bg-orange-500/20 text-orange-500',
  },
  {
    id: 'oauth',
    title: 'OAuth Providers',
    description: 'Gemini, Codex, Antigravity - zero config',
    icon: Zap,
    path: '/cliproxy',
    gradient: 'from-blue-500/20 to-cyan-500/10',
    iconBg: 'bg-blue-500/20 text-blue-500',
  },
  {
    id: 'accounts',
    title: 'Multiple Accounts',
    description: 'Isolated Claude instances for work & personal',
    icon: Users,
    path: '/accounts',
    gradient: 'from-violet-500/20 to-purple-500/10',
    iconBg: 'bg-violet-500/20 text-violet-500',
  },
];

// Quick launch shortcuts
const QUICK_LAUNCH = [
  { key: 'G', label: 'Gemini', command: 'ccs gemini' },
  { key: 'C', label: 'Codex', command: 'ccs codex' },
  { key: 'A', label: 'Agy', command: 'ccs agy' },
];

export function HomePage() {
  const navigate = useNavigate();
  const { data: overview, isLoading: isOverviewLoading } = useOverview();
  const { data: shared, isLoading: isSharedLoading } = useSharedSummary();

  if (isOverviewLoading || isSharedLoading) {
    return <HomePageSkeleton />;
  }

  const healthInfo = overview?.health?.status
    ? HEALTH_STATUS[overview.health.status as keyof typeof HEALTH_STATUS]
    : HEALTH_STATUS.ok;

  const pillarCounts = {
    api: overview?.profiles ?? 0,
    oauth: overview?.cliproxy ?? 0,
    accounts: overview?.accounts ?? 0,
  };

  return (
    <div className="relative min-h-screen">
      {/* Gradient Mesh Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-to-bl from-primary/5 via-transparent to-transparent rounded-full blur-3xl" />
        <div className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-gradient-to-tr from-primary/5 via-transparent to-transparent rounded-full blur-3xl" />
      </div>

      <div className="p-6 max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Hero Header */}
        <header className="relative">
          <Card className="overflow-hidden border-primary/10 bg-card/80 backdrop-blur-xl">
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20">
                      <Sparkles className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h1 className="text-2xl font-bold tracking-tight">CCS</h1>
                      <p className="text-sm text-muted-foreground">Multi-Account AI Management</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Badge variant="outline" className="font-mono text-xs px-3 py-1">
                    v{overview?.version ?? '0.0.0'}
                  </Badge>
                  <Badge variant="outline" className={cn('px-3 py-1 border', healthInfo.class)}>
                    <span className="w-1.5 h-1.5 rounded-full bg-current mr-2 animate-pulse" />
                    {healthInfo.label}
                  </Badge>
                </div>
              </div>

              {/* Command Palette Search Bar */}
              <div className="mt-6 group cursor-pointer" onClick={() => navigate('/health')}>
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-border/50 bg-muted/30 hover:bg-muted/50 hover:border-primary/30 transition-all">
                  <Search className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground flex-1">
                    Search commands, profiles, or run diagnostics...
                  </span>
                  <kbd className="hidden sm:inline-flex h-6 items-center gap-1 rounded border bg-muted px-2 font-mono text-xs text-muted-foreground">
                    <Command className="w-3 h-3" />K
                  </kbd>
                </div>
              </div>
            </CardContent>
          </Card>
        </header>

        {/* Configuration Warning */}
        {shared?.symlinkStatus && !shared.symlinkStatus.valid && (
          <Alert
            variant="warning"
            className="animate-in zoom-in-95 duration-300 border-amber-500/30 bg-amber-500/5"
          >
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Configuration Required</AlertTitle>
            <AlertDescription>{shared.symlinkStatus.message}</AlertDescription>
          </Alert>
        )}

        {/* Three Pillars Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold tracking-tight">The Three Pillars</h2>
            <span className="text-xs text-muted-foreground">— What do you want to do?</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {THREE_PILLARS.map((pillar) => {
              const Icon = pillar.icon;
              const count = pillarCounts[pillar.id as keyof typeof pillarCounts];
              return (
                <Card
                  key={pillar.id}
                  className={cn(
                    'group cursor-pointer overflow-hidden transition-all duration-300',
                    'hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1',
                    'border-border/50 bg-gradient-to-br',
                    pillar.gradient
                  )}
                  onClick={() => navigate(pillar.path)}
                >
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-start justify-between">
                      <div
                        className={cn(
                          'p-3 rounded-xl transition-transform group-hover:scale-110',
                          pillar.iconBg
                        )}
                      >
                        <Icon className="w-6 h-6" />
                      </div>
                      <span className="text-3xl font-bold font-mono opacity-80">{count}</span>
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                        {pillar.title}
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {pillar.description}
                      </p>
                    </div>
                    <div className="flex items-center text-sm text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                      <span>Configure</span>
                      <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Quick Launch & Health Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Launch */}
          <Card className="lg:col-span-2 border-border/50 bg-card/80 backdrop-blur-sm">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-muted-foreground" />
                  Quick Launch
                </h3>
                <span className="text-xs text-muted-foreground">Click to copy command</span>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                {QUICK_LAUNCH.map((item) => (
                  <button
                    key={item.key}
                    className="group flex flex-col items-center gap-2 p-4 rounded-xl border border-border/50 bg-muted/20 hover:bg-primary/10 hover:border-primary/30 transition-all"
                    onClick={() => navigator.clipboard.writeText(item.command)}
                    title={item.command}
                  >
                    <kbd className="w-10 h-10 flex items-center justify-center rounded-lg bg-muted font-mono text-lg font-bold group-hover:bg-primary/20 group-hover:text-primary transition-colors">
                      {item.key}
                    </kbd>
                    <span className="text-xs text-muted-foreground group-hover:text-primary transition-colors">
                      {item.label}
                    </span>
                  </button>
                ))}
                {/* Account shortcuts */}
                {overview?.accounts && overview.accounts > 0 && (
                  <>
                    <button
                      className="group flex flex-col items-center gap-2 p-4 rounded-xl border border-border/50 bg-muted/20 hover:bg-violet-500/10 hover:border-violet-500/30 transition-all"
                      onClick={() => navigate('/accounts')}
                      title="Switch account"
                    >
                      <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-muted font-mono text-lg font-bold group-hover:bg-violet-500/20 group-hover:text-violet-500 transition-colors">
                        <Users className="w-5 h-5" />
                      </div>
                      <span className="text-xs text-muted-foreground group-hover:text-violet-500 transition-colors">
                        Accounts
                      </span>
                    </button>
                  </>
                )}
                {/* Doctor shortcut */}
                <button
                  className="group flex flex-col items-center gap-2 p-4 rounded-xl border border-border/50 bg-muted/20 hover:bg-emerald-500/10 hover:border-emerald-500/30 transition-all"
                  onClick={() => navigate('/health')}
                  title="Run diagnostics"
                >
                  <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-muted font-mono text-lg font-bold group-hover:bg-emerald-500/20 group-hover:text-emerald-500 transition-colors">
                    <Stethoscope className="w-5 h-5" />
                  </div>
                  <span className="text-xs text-muted-foreground group-hover:text-emerald-500 transition-colors">
                    Doctor
                  </span>
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Health & Resources */}
          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardContent className="p-6 space-y-6">
              {/* Health Summary */}
              <div className="space-y-3">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
                  System Health
                </h3>
                <div
                  className="flex items-center justify-between p-4 rounded-xl bg-muted/30 hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => navigate('/health')}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'w-3 h-3 rounded-full',
                        overview?.health?.status === 'ok'
                          ? 'bg-emerald-500'
                          : overview?.health?.status === 'warning'
                            ? 'bg-amber-500'
                            : 'bg-red-500'
                      )}
                    />
                    <span className="font-mono text-2xl font-bold">
                      {overview?.health?.passed ?? 0}/{overview?.health?.total ?? 0}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">checks passed</span>
                </div>
              </div>

              {/* Resources Summary */}
              <div className="space-y-3">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
                  Shared Resources
                </h3>
                <div
                  className="grid grid-cols-3 gap-2 cursor-pointer"
                  onClick={() => navigate('/shared')}
                >
                  <div className="flex flex-col items-center p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                    <span className="font-mono text-xl font-bold text-primary">
                      {shared?.commands ?? 0}
                    </span>
                    <span className="text-xs text-muted-foreground">cmds</span>
                  </div>
                  <div className="flex flex-col items-center p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                    <span className="font-mono text-xl font-bold text-primary">
                      {shared?.skills ?? 0}
                    </span>
                    <span className="text-xs text-muted-foreground">skills</span>
                  </div>
                  <div className="flex flex-col items-center p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                    <span className="font-mono text-xl font-bold text-primary">
                      {shared?.agents ?? 0}
                    </span>
                    <span className="text-xs text-muted-foreground">agents</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Skeleton loader component
function HomePageSkeleton() {
  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      {/* Hero Skeleton */}
      <div className="rounded-xl border p-8">
        <div className="flex items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-xl" />
          <div>
            <Skeleton className="h-7 w-[120px] mb-2" />
            <Skeleton className="h-4 w-[200px]" />
          </div>
        </div>
        <Skeleton className="h-12 w-full mt-6 rounded-xl" />
      </div>

      {/* Pillars Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-6 border rounded-xl space-y-4">
            <div className="flex items-start justify-between">
              <Skeleton className="h-12 w-12 rounded-xl" />
              <Skeleton className="h-8 w-8" />
            </div>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-full" />
          </div>
        ))}
      </div>

      {/* Quick Launch Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 border rounded-xl p-6">
          <Skeleton className="h-6 w-32 mb-4" />
          <div className="grid grid-cols-6 gap-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))}
          </div>
        </div>
        <div className="border rounded-xl p-6 space-y-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-16 rounded-xl" />
          <Skeleton className="h-4 w-24" />
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
