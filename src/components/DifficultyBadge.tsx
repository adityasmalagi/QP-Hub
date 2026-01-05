import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type DifficultyLevel = 'easy' | 'medium' | 'hard';

interface DifficultyBadgeProps {
  difficulty: DifficultyLevel | null | undefined;
  ratingsCount?: number;
  className?: string;
  showCount?: boolean;
}

const difficultyStyles: Record<DifficultyLevel, string> = {
  easy: 'bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30 hover:bg-green-500/30',
  medium: 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/30',
  hard: 'bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30 hover:bg-red-500/30',
};

const difficultyLabels: Record<DifficultyLevel, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
};

export function DifficultyBadge({ difficulty, ratingsCount, className, showCount = false }: DifficultyBadgeProps) {
  if (!difficulty) return null;

  return (
    <Badge 
      variant="outline" 
      className={cn('text-xs', difficultyStyles[difficulty], className)}
    >
      {difficultyLabels[difficulty]}
      {showCount && ratingsCount !== undefined && ratingsCount > 0 && (
        <span className="ml-1 opacity-70">({ratingsCount})</span>
      )}
    </Badge>
  );
}
