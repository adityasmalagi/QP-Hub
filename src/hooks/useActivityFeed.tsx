import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface Activity {
  id: string;
  user_id: string;
  activity_type: 'upload' | 'comment' | 'vote' | 'bookmark' | 'download' | 'follow';
  target_type: string | null;
  target_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  user?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  };
}

export function useActivityFeed() {
  const { user } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActivities = useCallback(async () => {
    if (!user) {
      setActivities([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Get users that the current user follows
      const { data: follows, error: followsError } = await supabase
        .from('user_follows')
        .select('following_id')
        .eq('follower_id', user.id);

      if (followsError) throw followsError;

      const followingIds = follows?.map(f => f.following_id) || [];
      
      if (followingIds.length === 0) {
        setActivities([]);
        setLoading(false);
        return;
      }

      // Fetch activities from followed users
      const { data: activitiesData, error: activitiesError } = await supabase
        .from('user_activities')
        .select('*')
        .in('user_id', followingIds)
        .order('created_at', { ascending: false })
        .limit(50);

      if (activitiesError) throw activitiesError;

      // Fetch user profiles for activities
      const userIds = [...new Set(activitiesData?.map(a => a.user_id) || [])];
      const { data: profiles } = await supabase
        .from('public_profiles')
        .select('id, full_name, avatar_url')
        .in('id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      const activitiesWithUsers: Activity[] = (activitiesData || []).map(activity => ({
        ...activity,
        activity_type: activity.activity_type as Activity['activity_type'],
        metadata: activity.metadata as Record<string, unknown>,
        user: profileMap.get(activity.user_id) || undefined,
      }));

      setActivities(activitiesWithUsers);
    } catch (err) {
      console.error('Error fetching activities:', err);
      setError('Failed to load activity feed');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  return {
    activities,
    loading,
    error,
    refresh: fetchActivities,
  };
}
