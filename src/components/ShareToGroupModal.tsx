import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Share2, Loader2, Users, Check } from 'lucide-react';
import { useStudyGroups } from '@/hooks/useStudyGroups';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface ShareToGroupModalProps {
  paperId: string;
  paperTitle: string;
  trigger?: React.ReactNode;
}

export function ShareToGroupModal({ paperId, paperTitle, trigger }: ShareToGroupModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { myGroups, loading: groupsLoading } = useStudyGroups();
  const [open, setOpen] = useState(false);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [sharing, setSharing] = useState(false);

  const toggleGroup = (groupId: string) => {
    setSelectedGroups((prev) =>
      prev.includes(groupId) ? prev.filter((id) => id !== groupId) : [...prev, groupId]
    );
  };

  const handleShare = async () => {
    if (!user || selectedGroups.length === 0) return;

    setSharing(true);
    try {
      const inserts = selectedGroups.map((groupId) => ({
        group_id: groupId,
        paper_id: paperId,
        shared_by: user.id,
        note: note.trim() || null,
      }));

      const { error } = await supabase.from('group_papers').insert(inserts);

      if (error) {
        if (error.code === '23505') {
          toast({
            title: 'Already shared',
            description: 'This paper is already in one or more selected groups',
          });
        } else {
          throw error;
        }
      } else {
        toast({ title: 'Paper shared successfully!' });
        setOpen(false);
        setSelectedGroups([]);
        setNote('');
      }
    } catch (error) {
      console.error('Error sharing paper:', error);
      toast({
        title: 'Error',
        description: 'Failed to share paper',
        variant: 'destructive',
      });
    } finally {
      setSharing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Share2 className="mr-2 h-4 w-4" />
            Share to Group
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Paper to Group</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">
              Sharing: <span className="font-medium text-foreground">{paperTitle}</span>
            </p>
          </div>

          {groupsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : myGroups.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>You're not a member of any groups yet</p>
              <p className="text-sm mt-1">Join or create a group first!</p>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label>Select Groups</Label>
                <ScrollArea className="h-48 border rounded-md p-2">
                  <div className="space-y-2">
                    {myGroups.map((group) => (
                      <button
                        key={group.id}
                        type="button"
                        onClick={() => toggleGroup(group.id)}
                        className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors ${
                          selectedGroups.includes(group.id)
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <div className="text-left">
                          <p className="font-medium">{group.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {group.member_count} members
                          </p>
                        </div>
                        {selectedGroups.includes(group.id) && (
                          <Check className="h-5 w-5 text-primary" />
                        )}
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              <div className="space-y-2">
                <Label htmlFor="note">Add a note (optional)</Label>
                <Textarea
                  id="note"
                  placeholder="e.g., Great paper for revision!"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                />
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleShare}
                  disabled={selectedGroups.length === 0 || sharing}
                  className="flex-1"
                >
                  {sharing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Share2 className="mr-2 h-4 w-4" />
                      Share to {selectedGroups.length} group
                      {selectedGroups.length !== 1 ? 's' : ''}
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
