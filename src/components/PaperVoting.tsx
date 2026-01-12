import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface PaperVotingProps {
  paperId: string;
  initialUpvotes?: number;
  initialDownvotes?: number;
  className?: string;
  compact?: boolean;
}

export function PaperVoting({ 
  paperId, 
  initialUpvotes = 0, 
  initialDownvotes = 0,
  className,
  compact = false
}: PaperVotingProps) {
  const { user } = useAuth();
  const [upvotes, setUpvotes] = useState(initialUpvotes);
  const [downvotes, setDownvotes] = useState(initialDownvotes);
  const [userVote, setUserVote] = useState<'upvote' | 'downvote' | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchUserVote();
    }
  }, [user, paperId]);

  const fetchUserVote = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('paper_votes')
      .select('vote_type')
      .eq('paper_id', paperId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (!error && data) {
      setUserVote(data.vote_type as 'upvote' | 'downvote');
    }
  };

  const handleVote = async (voteType: 'upvote' | 'downvote') => {
    if (!user) {
      toast.error('Please sign in to vote');
      return;
    }

    if (loading) return;
    setLoading(true);

    try {
      if (userVote === voteType) {
        // Remove vote
        const { error } = await supabase
          .from('paper_votes')
          .delete()
          .eq('paper_id', paperId)
          .eq('user_id', user.id);

        if (error) throw error;

        if (voteType === 'upvote') {
          setUpvotes(prev => Math.max(0, prev - 1));
        } else {
          setDownvotes(prev => Math.max(0, prev - 1));
        }
        setUserVote(null);
        toast.success('Vote removed');
      } else if (userVote) {
        // Change vote
        const { error } = await supabase
          .from('paper_votes')
          .update({ vote_type: voteType })
          .eq('paper_id', paperId)
          .eq('user_id', user.id);

        if (error) throw error;

        if (voteType === 'upvote') {
          setUpvotes(prev => prev + 1);
          setDownvotes(prev => Math.max(0, prev - 1));
        } else {
          setDownvotes(prev => prev + 1);
          setUpvotes(prev => Math.max(0, prev - 1));
        }
        setUserVote(voteType);
        toast.success(voteType === 'upvote' ? 'Upvoted!' : 'Downvoted');
      } else {
        // New vote
        const { error } = await supabase
          .from('paper_votes')
          .insert({
            paper_id: paperId,
            user_id: user.id,
            vote_type: voteType
          });

        if (error) throw error;

        if (voteType === 'upvote') {
          setUpvotes(prev => prev + 1);
        } else {
          setDownvotes(prev => prev + 1);
        }
        setUserVote(voteType);
        toast.success(voteType === 'upvote' ? 'Upvoted!' : 'Downvoted');
      }
    } catch (error) {
      console.error('Error voting:', error);
      toast.error('Failed to vote');
    } finally {
      setLoading(false);
    }
  };

  if (compact) {
    return (
      <div className={cn("flex items-center gap-1", className)}>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleVote('upvote')}
          disabled={loading}
          className={cn(
            "h-7 px-2 gap-1",
            userVote === 'upvote' && "text-green-500 bg-green-500/10"
          )}
        >
          <ThumbsUp className="h-3.5 w-3.5" />
          <span className="text-xs">{upvotes}</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleVote('downvote')}
          disabled={loading}
          className={cn(
            "h-7 px-2 gap-1",
            userVote === 'downvote' && "text-red-500 bg-red-500/10"
          )}
        >
          <ThumbsDown className="h-3.5 w-3.5" />
          <span className="text-xs">{downvotes}</span>
        </Button>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className="text-sm text-muted-foreground">Rate this paper:</span>
      <div className="flex items-center gap-1 rounded-lg border border-border p-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleVote('upvote')}
          disabled={loading}
          className={cn(
            "gap-1.5",
            userVote === 'upvote' && "text-green-500 bg-green-500/10 hover:bg-green-500/20"
          )}
        >
          <ThumbsUp className={cn("h-4 w-4", userVote === 'upvote' && "fill-current")} />
          <span>{upvotes}</span>
        </Button>
        <div className="h-6 w-px bg-border" />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleVote('downvote')}
          disabled={loading}
          className={cn(
            "gap-1.5",
            userVote === 'downvote' && "text-red-500 bg-red-500/10 hover:bg-red-500/20"
          )}
        >
          <ThumbsDown className={cn("h-4 w-4", userVote === 'downvote' && "fill-current")} />
          <span>{downvotes}</span>
        </Button>
      </div>
    </div>
  );
}
