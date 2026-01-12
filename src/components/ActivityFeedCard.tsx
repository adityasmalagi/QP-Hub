import { Link } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, MessageSquare, ThumbsUp, Heart, Download, UserPlus } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Activity } from '@/hooks/useActivityFeed';

interface ActivityFeedCardProps {
  activity: Activity;
}

const ACTIVITY_CONFIG = {
  upload: {
    icon: FileText,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    label: 'uploaded a paper',
  },
  comment: {
    icon: MessageSquare,
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
    label: 'commented on a paper',
  },
  vote: {
    icon: ThumbsUp,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
    label: 'voted on a paper',
  },
  bookmark: {
    icon: Heart,
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
    label: 'bookmarked a paper',
  },
  download: {
    icon: Download,
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
    label: 'downloaded a paper',
  },
  follow: {
    icon: UserPlus,
    color: 'text-cyan-500',
    bgColor: 'bg-cyan-500/10',
    label: 'followed someone',
  },
};

export function ActivityFeedCard({ activity }: ActivityFeedCardProps) {
  const config = ACTIVITY_CONFIG[activity.activity_type];
  const IconComponent = config.icon;

  const userName = activity.user?.full_name || 'Anonymous';
  const userInitials = userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const getActionContent = () => {
    const metadata = activity.metadata || {};
    
    switch (activity.activity_type) {
      case 'upload':
        return (
          <div className="mt-2 rounded-lg border border-border bg-muted/30 p-3">
            <Link 
              to={`/paper/${activity.target_id}`}
              className="font-medium text-foreground hover:text-primary transition-colors"
            >
              {(metadata.title as string) || 'Untitled Paper'}
            </Link>
            {metadata.subject && (
              <Badge variant="secondary" className="ml-2 text-xs">
                {metadata.subject as string}
              </Badge>
            )}
          </div>
        );
      case 'comment':
        return (
          <div className="mt-2 rounded-lg border border-border bg-muted/30 p-3">
            <p className="text-sm text-muted-foreground line-clamp-2">
              "{(metadata.content as string) || 'Comment'}"
            </p>
            <Link 
              to={`/paper/${activity.target_id}`}
              className="mt-1 inline-block text-xs text-primary hover:underline"
            >
              View paper →
            </Link>
          </div>
        );
      case 'vote':
        return (
          <div className="mt-2">
            <Badge variant={metadata.vote_type === 'upvote' ? 'default' : 'secondary'}>
              {metadata.vote_type === 'upvote' ? '👍 Upvoted' : '👎 Downvoted'}
            </Badge>
            <Link 
              to={`/paper/${activity.target_id}`}
              className="ml-2 text-xs text-primary hover:underline"
            >
              View paper
            </Link>
          </div>
        );
      case 'follow':
        return (
          <Link 
            to={`/user/${activity.target_id}`}
            className="mt-2 inline-block text-sm text-primary hover:underline"
          >
            View profile →
          </Link>
        );
      default:
        return activity.target_id ? (
          <Link 
            to={`/paper/${activity.target_id}`}
            className="mt-2 inline-block text-sm text-primary hover:underline"
          >
            View paper →
          </Link>
        ) : null;
    }
  };

  return (
    <Card className="overflow-hidden transition-all hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex gap-3">
          <div className="relative">
            <Link to={`/user/${activity.user_id}`}>
              <Avatar className="h-10 w-10">
                <AvatarImage src={activity.user?.avatar_url || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary text-sm">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
            </Link>
            <div className={`absolute -bottom-1 -right-1 rounded-full p-1 ${config.bgColor}`}>
              <IconComponent className={`h-3 w-3 ${config.color}`} />
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Link 
                to={`/user/${activity.user_id}`}
                className="font-medium text-foreground hover:text-primary transition-colors"
              >
                {userName}
              </Link>
              <span className="text-sm text-muted-foreground">{config.label}</span>
            </div>
            
            <p className="text-xs text-muted-foreground mt-0.5">
              {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
            </p>
            
            {getActionContent()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
