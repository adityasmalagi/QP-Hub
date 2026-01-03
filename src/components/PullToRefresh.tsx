import { RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PullToRefreshIndicatorProps {
  pullDistance: number;
  isRefreshing: boolean;
  progress: number;
  shouldTrigger: boolean;
}

export function PullToRefreshIndicator({
  pullDistance,
  isRefreshing,
  progress,
  shouldTrigger,
}: PullToRefreshIndicatorProps) {
  if (pullDistance === 0 && !isRefreshing) return null;

  return (
    <div
      className="flex items-center justify-center overflow-hidden transition-all duration-200 sm:hidden"
      style={{ height: pullDistance }}
    >
      <div
        className={cn(
          "flex items-center justify-center rounded-full bg-secondary p-2 transition-all",
          shouldTrigger && !isRefreshing && "bg-primary/20",
          isRefreshing && "bg-primary/20"
        )}
        style={{
          transform: `scale(${0.5 + progress * 0.5}) rotate(${progress * 180}deg)`,
          opacity: Math.min(progress * 1.5, 1),
        }}
      >
        <RefreshCw
          className={cn(
            "h-5 w-5 text-muted-foreground transition-colors",
            shouldTrigger && "text-primary",
            isRefreshing && "text-primary animate-spin"
          )}
        />
      </div>
    </div>
  );
}
