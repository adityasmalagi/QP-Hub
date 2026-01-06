import { useParams, useNavigate, Link } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { useGroupDetails } from '@/hooks/useStudyGroups';
import { useGroupPapers } from '@/hooks/useGroupPapers';
import { GroupChat } from '@/components/GroupChat';
import { GroupMembersList } from '@/components/GroupMembersList';
import { GroupPapersList } from '@/components/GroupPapersList';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { ArrowLeft, Loader2, Users, MessageCircle, FileText, Settings, LogOut, Trash2, Globe, Lock } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useStudyGroups } from '@/hooks/useStudyGroups';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export default function GroupDetail() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { group, members, loading, refetch } = useGroupDetails(groupId);
  const { papers, loading: papersLoading, removePaper } = useGroupPapers(groupId);
  const { leaveGroup, deleteGroup } = useStudyGroups();

  const handleLeave = async () => {
    if (!groupId) return;
    const success = await leaveGroup(groupId);
    if (success) {
      navigate('/groups');
    }
  };

  const handleDelete = async () => {
    if (!groupId) return;
    const success = await deleteGroup(groupId);
    if (success) {
      navigate('/groups');
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;
      toast({ title: 'Member removed' });
      refetch();
    } catch (error) {
      console.error('Error removing member:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove member',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center py-32">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Group not found</h1>
          <p className="text-muted-foreground mb-4">
            This group doesn't exist or you don't have access to it.
          </p>
          <Link to="/groups">
            <Button>Back to Groups</Button>
          </Link>
        </div>
      </div>
    );
  }

  const isOwner = group.user_role === 'owner';
  const isAdmin = group.user_role === 'admin' || isOwner;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        <Link
          to="/groups"
          className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Groups
        </Link>

        <div className="mb-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-foreground">{group.name}</h1>
                {group.is_public ? (
                  <Badge variant="secondary" className="gap-1">
                    <Globe className="h-3 w-3" />
                    Public
                  </Badge>
                ) : (
                  <Badge variant="outline" className="gap-1">
                    <Lock className="h-3 w-3" />
                    Private
                  </Badge>
                )}
              </div>
              {group.description && (
                <p className="text-muted-foreground">{group.description}</p>
              )}
              <div className="flex flex-wrap gap-2 mt-3">
                {group.subject && (
                  <Badge variant="secondary">{group.subject}</Badge>
                )}
                {group.class_level && (
                  <Badge variant="outline">{group.class_level}</Badge>
                )}
                {group.board && (
                  <Badge variant="outline">{group.board}</Badge>
                )}
              </div>
            </div>

            {user && group.is_member && (
              <div className="flex gap-2">
                {!isOwner && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <LogOut className="mr-2 h-4 w-4" />
                        Leave
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Leave group?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to leave this group? You can join again later if
                          the group is public.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleLeave}>Leave Group</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
                {isOwner && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete group?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. All messages, shared papers, and member
                          data will be permanently deleted.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDelete}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete Group
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            )}
          </div>
        </div>

        {group.is_member ? (
          <Tabs defaultValue="chat" className="space-y-6">
            <TabsList>
              <TabsTrigger value="chat" className="gap-2">
                <MessageCircle className="h-4 w-4" />
                Chat
              </TabsTrigger>
              <TabsTrigger value="papers" className="gap-2">
                <FileText className="h-4 w-4" />
                Papers ({papers.length})
              </TabsTrigger>
              <TabsTrigger value="members" className="gap-2">
                <Users className="h-4 w-4" />
                Members ({members.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="chat">
              <GroupChat groupId={groupId!} />
            </TabsContent>

            <TabsContent value="papers">
              <GroupPapersList
                papers={papers}
                loading={papersLoading}
                canRemove={isAdmin}
                onRemove={removePaper}
              />
            </TabsContent>

            <TabsContent value="members">
              <GroupMembersList
                members={members}
                userRole={group.user_role}
                onRemoveMember={handleRemoveMember}
              />
            </TabsContent>
          </Tabs>
        ) : (
          <div className="text-center py-16 text-muted-foreground">
            <Users className="mx-auto h-16 w-16 mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-1">Join to view content</h3>
            <p className="text-sm mb-4">
              You need to be a member to see chat, papers, and member list.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
