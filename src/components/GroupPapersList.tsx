import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Trash2, Loader2, ExternalLink } from 'lucide-react';
import { GroupPaper } from '@/hooks/useGroupPapers';
import { formatDistanceToNow } from 'date-fns';

interface GroupPapersListProps {
  papers: GroupPaper[];
  loading?: boolean;
  canRemove?: boolean;
  onRemove?: (groupPaperId: string) => void;
}

export function GroupPapersList({ papers, loading, canRemove, onRemove }: GroupPapersListProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (papers.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No papers shared yet</p>
            <p className="text-sm mt-1">Share a paper to start collaborating!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Shared Papers ({papers.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {papers.map((paper) => (
            <div
              key={paper.id}
              className="flex items-center justify-between p-3 rounded-lg border bg-card hover:border-primary/50 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <Link
                  to={`/paper/${paper.paper_id}`}
                  className="font-medium hover:text-primary transition-colors line-clamp-1"
                >
                  {paper.paper_title || 'Untitled Paper'}
                </Link>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  {paper.paper_subject && (
                    <Badge variant="secondary" className="text-xs">
                      {paper.paper_subject}
                    </Badge>
                  )}
                  {paper.paper_year && (
                    <Badge variant="outline" className="text-xs">
                      {paper.paper_year}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Shared by {paper.sharer_name || 'Someone'}{' '}
                  {formatDistanceToNow(new Date(paper.shared_at), { addSuffix: true })}
                </p>
                {paper.note && (
                  <p className="text-sm text-muted-foreground mt-1 italic">"{paper.note}"</p>
                )}
              </div>
              <div className="flex items-center gap-2 ml-4">
                <Link to={`/paper/${paper.paper_id}`}>
                  <Button size="icon" variant="ghost" className="h-8 w-8">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </Link>
                {canRemove && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => onRemove?.(paper.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
