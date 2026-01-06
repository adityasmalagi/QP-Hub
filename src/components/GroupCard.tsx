import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, BookOpen, GraduationCap, Lock, Globe } from 'lucide-react';
import { StudyGroup } from '@/hooks/useStudyGroups';
import { useAuth } from '@/hooks/useAuth';

interface GroupCardProps {
  group: StudyGroup;
  onJoin?: (groupId: string) => void;
  onLeave?: (groupId: string) => void;
}

export function GroupCard({ group, onJoin, onLeave }: GroupCardProps) {
  const { user } = useAuth();

  return (
    <Card className="group relative overflow-hidden transition-all hover:shadow-lg hover:border-primary/50">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg line-clamp-1">{group.name}</CardTitle>
            {group.description && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {group.description}
              </p>
            )}
          </div>
          {group.is_public ? (
            <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
          ) : (
            <Lock className="h-4 w-4 text-muted-foreground shrink-0" />
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {group.subject && (
            <Badge variant="secondary" className="text-xs">
              <BookOpen className="mr-1 h-3 w-3" />
              {group.subject}
            </Badge>
          )}
          {group.class_level && (
            <Badge variant="outline" className="text-xs">
              <GraduationCap className="mr-1 h-3 w-3" />
              {group.class_level}
            </Badge>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center text-sm text-muted-foreground">
            <Users className="mr-1 h-4 w-4" />
            {group.member_count || 0} {group.member_count === 1 ? 'member' : 'members'}
          </div>

          {user && group.is_member ? (
            <div className="flex items-center gap-2">
              {group.user_role && (
                <Badge variant="outline" className="text-xs capitalize">
                  {group.user_role}
                </Badge>
              )}
              <Link to={`/groups/${group.id}`}>
                <Button size="sm">View</Button>
              </Link>
            </div>
          ) : user ? (
            <Button size="sm" onClick={() => onJoin?.(group.id)}>
              Join
            </Button>
          ) : (
            <Link to="/auth?redirect=/groups">
              <Button size="sm" variant="outline">
                Sign in to join
              </Button>
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
