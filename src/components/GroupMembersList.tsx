import { Link } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Crown, Shield, UserMinus, Loader2 } from 'lucide-react';
import { GroupMember } from '@/hooks/useStudyGroups';
import { useAuth } from '@/hooks/useAuth';

interface GroupMembersListProps {
  members: GroupMember[];
  userRole?: 'owner' | 'admin' | 'member' | null;
  onRemoveMember?: (memberId: string) => void;
  loading?: boolean;
}

export function GroupMembersList({
  members,
  userRole,
  onRemoveMember,
  loading,
}: GroupMembersListProps) {
  const { user } = useAuth();
  const canManageMembers = userRole === 'owner' || userRole === 'admin';

  const getRoleIcon = (role: string) => {
    if (role === 'owner') return <Crown className="h-4 w-4 text-yellow-500" />;
    if (role === 'admin') return <Shield className="h-4 w-4 text-blue-500" />;
    return null;
  };

  const getRoleBadge = (role: string) => {
    if (role === 'owner') {
      return (
        <Badge variant="outline" className="border-yellow-500/50 text-yellow-600 dark:text-yellow-400">
          Owner
        </Badge>
      );
    }
    if (role === 'admin') {
      return (
        <Badge variant="outline" className="border-blue-500/50 text-blue-600 dark:text-blue-400">
          Admin
        </Badge>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Members ({members.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {members.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <Link
                to={`/user/${member.user_id}`}
                className="flex items-center gap-3 flex-1 min-w-0"
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage src={member.user_avatar || undefined} />
                  <AvatarFallback>
                    {member.user_name?.charAt(0)?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate">
                      {member.user_name || 'Anonymous'}
                    </span>
                    {getRoleIcon(member.role)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Joined {new Date(member.joined_at).toLocaleDateString()}
                  </p>
                </div>
              </Link>
              <div className="flex items-center gap-2">
                {getRoleBadge(member.role)}
                {canManageMembers &&
                  member.user_id !== user?.id &&
                  member.role !== 'owner' && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => onRemoveMember?.(member.id)}
                    >
                      <UserMinus className="h-4 w-4" />
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
