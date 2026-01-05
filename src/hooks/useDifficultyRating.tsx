import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export type DifficultyLevel = 'easy' | 'medium' | 'hard';

interface DifficultyStats {
  avgDifficulty: DifficultyLevel | null;
  ratingsCount: number;
  userRating: DifficultyLevel | null;
}

export function useDifficultyRating(paperId: string | undefined) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [stats, setStats] = useState<DifficultyStats>({
    avgDifficulty: null,
    ratingsCount: 0,
    userRating: null,
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchRatings = useCallback(async () => {
    if (!paperId) return;

    try {
      // Fetch paper's average difficulty and count
      const { data: paperData } = await supabase
        .from('question_papers')
        .select('avg_difficulty, ratings_count')
        .eq('id', paperId)
        .maybeSingle();

      // Fetch user's rating if logged in
      let userRating: DifficultyLevel | null = null;
      if (user) {
        const { data: ratingData } = await supabase
          .from('paper_ratings')
          .select('difficulty')
          .eq('paper_id', paperId)
          .eq('user_id', user.id)
          .maybeSingle();
        
        userRating = ratingData?.difficulty as DifficultyLevel | null;
      }

      setStats({
        avgDifficulty: paperData?.avg_difficulty as DifficultyLevel | null,
        ratingsCount: paperData?.ratings_count || 0,
        userRating,
      });
    } catch (error) {
      console.error('Error fetching ratings:', error);
    } finally {
      setLoading(false);
    }
  }, [paperId, user]);

  useEffect(() => {
    fetchRatings();
  }, [fetchRatings]);

  const rateDifficulty = async (difficulty: DifficultyLevel) => {
    if (!user) {
      toast({
        title: 'Login Required',
        description: 'Please log in to rate paper difficulty',
        variant: 'destructive',
      });
      return;
    }

    if (!paperId) return;

    setSubmitting(true);
    try {
      // Upsert rating
      const { error } = await supabase
        .from('paper_ratings')
        .upsert(
          {
            paper_id: paperId,
            user_id: user.id,
            difficulty,
          },
          { onConflict: 'paper_id,user_id' }
        );

      if (error) throw error;

      // Update local state optimistically
      setStats(prev => ({
        ...prev,
        userRating: difficulty,
      }));

      // Refetch to get updated average
      await fetchRatings();

      toast({
        title: 'Rating submitted',
        description: `You rated this paper as ${difficulty}`,
      });
    } catch (error) {
      console.error('Error submitting rating:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit rating',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return {
    ...stats,
    loading,
    submitting,
    rateDifficulty,
  };
}
