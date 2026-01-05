import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ThumbsUp, User, Calendar, Trash2, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

interface PaperRequestCardProps {
  request: {
    id: string;
    user_id: string;
    title: string;
    description: string | null;
    subject: string;
    class_level: string;
    board: string;
    year: number | null;
    exam_type: string | null;
    status: 'open' | 'fulfilled' | 'closed';
    upvotes_count: number;
    created_at: string;
    requester_name?: string | null;
    has_upvoted?: boolean;
    fulfilled_by_paper_id?: string | null;
  };
  onUpvote: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function PaperRequestCard({ request, onUpvote, onDelete }: PaperRequestCardProps) {
  const { user } = useAuth();
  const isOwner = user?.id === request.user_id;

  const getStatusBadge = () => {
    switch (request.status) {
      case 'fulfilled':
        return (
          <Badge variant="default" className="bg-green-500">
            <CheckCircle className="mr-1 h-3 w-3" />
            Fulfilled
          </Badge>
        );
      case 'closed':
        return <Badge variant="secondary">Closed</Badge>;
      default:
        return <Badge variant="outline">Open</Badge>;
    }
  };

  return (
    <Card className="transition-all hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              {getStatusBadge()}
              <Badge variant="secondary">{request.board.toUpperCase()}</Badge>
              <Badge variant="outline">Class {request.class_level}</Badge>
              <Badge variant="outline">{request.subject}</Badge>
              {request.year && <Badge variant="outline">{request.year}</Badge>}
            </div>
            
            <h3 className="font-semibold text-lg mb-1 line-clamp-1">
              {request.title}
            </h3>
            
            {request.description && (
              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                {request.description}
              </p>
            )}
            
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {request.requester_name || 'Anonymous'}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {new Date(request.created_at).toLocaleDateString()}
              </span>
            </div>

            {request.status === 'fulfilled' && request.fulfilled_by_paper_id && (
              <Link 
                to={`/paper/${request.fulfilled_by_paper_id}`}
                className="inline-block mt-2 text-sm text-primary hover:underline"
              >
                View fulfilled paper →
              </Link>
            )}
          </div>

          <div className="flex flex-col items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onUpvote(request.id)}
              className={cn(
                'flex flex-col items-center gap-1 h-auto py-2',
                request.has_upvoted && 'text-primary'
              )}
              disabled={request.status !== 'open'}
            >
              <ThumbsUp 
                className={cn(
                  'h-5 w-5',
                  request.has_upvoted && 'fill-current'
                )} 
              />
              <span className="text-sm font-medium">{request.upvotes_count}</span>
            </Button>
            
            {isOwner && onDelete && request.status === 'open' && (
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive hover:text-destructive"
                onClick={() => onDelete(request.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
