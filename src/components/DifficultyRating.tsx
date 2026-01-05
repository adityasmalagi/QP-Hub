import { Button } from '@/components/ui/button';
import { useDifficultyRating, DifficultyLevel } from '@/hooks/useDifficultyRating';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface DifficultyRatingProps {
  paperId: string;
  className?: string;
}

const difficultyConfig: Record<DifficultyLevel, { label: string; color: string; bgColor: string }> = {
  easy: {
    label: 'Easy',
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-500/20 hover:bg-green-500/30 border-green-500/30',
  },
  medium: {
    label: 'Medium',
    color: 'text-yellow-600 dark:text-yellow-400',
    bgColor: 'bg-yellow-500/20 hover:bg-yellow-500/30 border-yellow-500/30',
  },
  hard: {
    label: 'Hard',
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-500/20 hover:bg-red-500/30 border-red-500/30',
  },
};

export function DifficultyRating({ paperId, className }: DifficultyRatingProps) {
  const { avgDifficulty, ratingsCount, userRating, loading, submitting, rateDifficulty } = useDifficultyRating(paperId);

  if (loading) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Loading ratings...</span>
      </div>
    );
  }

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">Rate Difficulty</span>
        {ratingsCount > 0 && avgDifficulty && (
          <span className={cn('text-sm font-medium', difficultyConfig[avgDifficulty].color)}>
            {difficultyConfig[avgDifficulty].label} ({ratingsCount} {ratingsCount === 1 ? 'rating' : 'ratings'})
          </span>
        )}
      </div>
      
      <div className="flex gap-2">
        {(Object.keys(difficultyConfig) as DifficultyLevel[]).map((level) => (
          <Button
            key={level}
            variant="outline"
            size="sm"
            disabled={submitting}
            onClick={() => rateDifficulty(level)}
            className={cn(
              'flex-1 transition-all',
              difficultyConfig[level].color,
              userRating === level && difficultyConfig[level].bgColor,
              userRating === level && 'ring-2 ring-offset-2 ring-offset-background',
              userRating === level && level === 'easy' && 'ring-green-500/50',
              userRating === level && level === 'medium' && 'ring-yellow-500/50',
              userRating === level && level === 'hard' && 'ring-red-500/50'
            )}
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              difficultyConfig[level].label
            )}
          </Button>
        ))}
      </div>
      
      {userRating && (
        <p className="text-xs text-muted-foreground">
          You rated this paper as {userRating}
        </p>
      )}
    </div>
  );
}
