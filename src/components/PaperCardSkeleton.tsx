import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function PaperCardSkeleton() {
  return (
    <Card className="h-full border-border/50 bg-card">
      <CardContent className="p-5">
        <div className="mb-3 flex items-start justify-between gap-2">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-8 w-8 rounded-md" />
          </div>
        </div>
        
        <Skeleton className="mb-2 h-5 w-full" />
        <Skeleton className="mb-4 h-5 w-3/4" />
        
        <div className="mb-4 flex flex-wrap gap-1.5">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-14 rounded-full" />
          <Skeleton className="h-5 w-12 rounded-full" />
        </div>
        
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-4 w-12" />
          </div>
          <Skeleton className="h-4 w-32" />
        </div>
      </CardContent>
    </Card>
  );
}
