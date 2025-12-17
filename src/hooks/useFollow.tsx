import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export function useFollow(targetUserId: string | undefined) {
  const { user } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchFollowStatus = useCallback(async () => {
    if (!targetUserId) return;

    try {
      // Check if current user follows target
      if (user) {
        const { data: followData } = await supabase
          .from('user_follows')
          .select('id')
          .eq('follower_id', user.id)
          .eq('following_id', targetUserId)
          .maybeSingle();
        
        setIsFollowing(!!followData);
      }

      // Get follower count
      const { count } = await supabase
        .from('user_follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', targetUserId);
      
      setFollowerCount(count || 0);
    } catch (error) {
      console.error('Error fetching follow status:', error);
    } finally {
      setLoading(false);
    }
  }, [user, targetUserId]);

  useEffect(() => {
    fetchFollowStatus();
  }, [fetchFollowStatus]);

  const toggleFollow = async () => {
    if (!user || !targetUserId) {
      toast({
        title: 'Login Required',
        description: 'Please log in to follow users',
        variant: 'destructive',
      });
      return;
    }

    if (user.id === targetUserId) {
      toast({
        title: 'Error',
        description: "You can't follow yourself",
        variant: 'destructive',
      });
      return;
    }

    try {
      if (isFollowing) {
        await supabase
          .from('user_follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', targetUserId);
        
        setIsFollowing(false);
        setFollowerCount(prev => Math.max(0, prev - 1));
        toast({ title: 'Unfollowed successfully' });
      } else {
        await supabase
          .from('user_follows')
          .insert({ follower_id: user.id, following_id: targetUserId });
        
        setIsFollowing(true);
        setFollowerCount(prev => prev + 1);
        toast({ title: 'Now following this user!' });
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      toast({
        title: 'Error',
        description: 'Failed to update follow status',
        variant: 'destructive',
      });
    }
  };

  return { isFollowing, followerCount, loading, toggleFollow };
}
