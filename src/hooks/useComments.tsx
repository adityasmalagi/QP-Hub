import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface Comment {
  id: string;
  paper_id: string;
  user_id: string;
  parent_id: string | null;
  content: string;
  is_solution: boolean;
  upvotes_count: number;
  created_at: string;
  updated_at: string;
  user_name?: string | null;
  user_avatar?: string | null;
  has_upvoted?: boolean;
  replies?: Comment[];
}

export function useComments(paperId: string | undefined) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchComments = useCallback(async () => {
    if (!paperId) return;

    try {
      // Fetch all comments for the paper
      const { data: commentsData, error } = await supabase
        .from('paper_comments')
        .select('*')
        .eq('paper_id', paperId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (commentsData && commentsData.length > 0) {
        // Fetch user profiles
        const userIds = [...new Set(commentsData.map(c => c.user_id))];
        const { data: profiles } = await supabase
          .from('public_profiles')
          .select('id, full_name, avatar_url')
          .in('id', userIds);

        const profileMap = new Map(
          profiles?.map(p => [p.id, { name: p.full_name, avatar: p.avatar_url }]) || []
        );

        // Fetch user's upvotes if logged in
        let userUpvotes = new Set<string>();
        if (user) {
          const { data: upvotesData } = await supabase
            .from('comment_upvotes')
            .select('comment_id')
            .eq('user_id', user.id);
          
          userUpvotes = new Set(upvotesData?.map(u => u.comment_id) || []);
        }

        // Build comment tree
        const commentsWithMeta = commentsData.map(comment => ({
          ...comment,
          user_name: profileMap.get(comment.user_id)?.name || null,
          user_avatar: profileMap.get(comment.user_id)?.avatar || null,
          has_upvoted: userUpvotes.has(comment.id),
          replies: [] as Comment[],
        }));

        // Organize into tree structure
        const rootComments: Comment[] = [];
        const commentMap = new Map<string, Comment>();

        commentsWithMeta.forEach(comment => {
          commentMap.set(comment.id, comment);
        });

        commentsWithMeta.forEach(comment => {
          if (comment.parent_id) {
            const parent = commentMap.get(comment.parent_id);
            if (parent) {
              parent.replies = parent.replies || [];
              parent.replies.push(comment);
            }
          } else {
            rootComments.push(comment);
          }
        });

        setComments(rootComments);
      } else {
        setComments([]);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  }, [paperId, user]);

  useEffect(() => {
    fetchComments();

    // Subscribe to real-time comment updates
    if (paperId) {
      const channel = supabase
        .channel(`comments-${paperId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'paper_comments',
            filter: `paper_id=eq.${paperId}`,
          },
          () => fetchComments()
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'comment_upvotes',
          },
          () => fetchComments()
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [fetchComments, paperId]);

  const addComment = async (content: string, parentId?: string) => {
    if (!user) {
      toast({
        title: 'Login Required',
        description: 'Please log in to comment',
        variant: 'destructive',
      });
      return false;
    }

    if (!paperId || !content.trim()) return false;

    setSubmitting(true);
    try {
      const { error } = await supabase.from('paper_comments').insert({
        paper_id: paperId,
        user_id: user.id,
        parent_id: parentId || null,
        content: content.trim(),
      });

      if (error) throw error;

      await fetchComments();
      toast({ title: 'Comment added!' });
      return true;
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({
        title: 'Error',
        description: 'Failed to add comment',
        variant: 'destructive',
      });
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  const deleteComment = async (commentId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('paper_comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', user.id);

      if (error) throw error;

      await fetchComments();
      toast({ title: 'Comment deleted' });
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete comment',
        variant: 'destructive',
      });
    }
  };

  const toggleUpvote = async (commentId: string) => {
    if (!user) {
      toast({
        title: 'Login Required',
        description: 'Please log in to upvote',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Check if already upvoted
      const { data: existing } = await supabase
        .from('comment_upvotes')
        .select('id')
        .eq('comment_id', commentId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        // Remove upvote
        await supabase
          .from('comment_upvotes')
          .delete()
          .eq('id', existing.id);
      } else {
        // Add upvote
        await supabase.from('comment_upvotes').insert({
          comment_id: commentId,
          user_id: user.id,
        });
      }

      await fetchComments();
    } catch (error) {
      console.error('Error toggling upvote:', error);
    }
  };

  const markAsSolution = async (commentId: string, isSolution: boolean) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('paper_comments')
        .update({ is_solution: isSolution })
        .eq('id', commentId);

      if (error) throw error;

      await fetchComments();
      toast({ title: isSolution ? 'Marked as solution!' : 'Unmarked as solution' });
    } catch (error) {
      console.error('Error marking solution:', error);
    }
  };

  return {
    comments,
    loading,
    submitting,
    addComment,
    deleteComment,
    toggleUpvote,
    markAsSolution,
    refetch: fetchComments,
  };
}
