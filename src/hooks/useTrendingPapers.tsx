import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface TrendingPaper {
  id: string;
  title: string;
  subject: string;
  board: string;
  class_level: string;
  year: number;
  exam_type: string;
  views_count: number;
  downloads_count: number;
  semester: number | null;
  internal_number: number | null;
  institute_name: string | null;
  user_id: string;
  created_at: string | null;
  avg_difficulty: string | null;
  ratings_count: number | null;
  uploaderName?: string | null;
  uploaderAvatar?: string | null;
  trendingScore?: number;
}

type TimeFrame = 'daily' | 'weekly' | 'monthly';

export function useTrendingPapers(timeFrame: TimeFrame = 'weekly', limit = 8) {
  const [papers, setPapers] = useState<TrendingPaper[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchTrendingPapers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Calculate date range based on timeframe
      const now = new Date();
      let startDate: Date;
      
      switch (timeFrame) {
        case 'daily':
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case 'weekly':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'monthly':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
      }

      // Fetch papers with recent activity
      // For simplicity, we'll use views_count and downloads_count
      // In production, you'd want to query paper_metric_events for more accurate trending
      const { data: papersData, error: papersError } = await supabase
        .from('question_papers')
        .select('id, title, subject, board, class_level, year, exam_type, views_count, downloads_count, semester, internal_number, institute_name, user_id, created_at, avg_difficulty, ratings_count')
        .eq('status', 'approved')
        .order('views_count', { ascending: false })
        .limit(limit * 2); // Fetch more to calculate trending score

      if (papersError) throw papersError;

      if (papersData && papersData.length > 0) {
        // Calculate trending score: views + (downloads * 3) + recency bonus
        const papersWithScore = papersData.map(paper => {
          const createdAt = paper.created_at ? new Date(paper.created_at) : new Date(0);
          const ageInDays = (now.getTime() - createdAt.getTime()) / (24 * 60 * 60 * 1000);
          const recencyBonus = Math.max(0, 10 - ageInDays); // Bonus for papers < 10 days old
          
          const trendingScore = 
            (paper.views_count || 0) + 
            ((paper.downloads_count || 0) * 3) + 
            (recencyBonus * 5);
          
          return { ...paper, trendingScore };
        });

        // Sort by trending score and take top results
        const sortedPapers = papersWithScore
          .sort((a, b) => (b.trendingScore || 0) - (a.trendingScore || 0))
          .slice(0, limit);

        // Fetch uploader names and avatars
        const userIds = [...new Set(sortedPapers.map(p => p.user_id))];
        const { data: profiles } = await supabase
          .from('public_profiles')
          .select('id, full_name, avatar_url')
          .in('id', userIds);

        const profileMap = new Map(profiles?.map(p => [p.id, { name: p.full_name, avatar: p.avatar_url }]) || []);
        const papersWithUploaders = sortedPapers.map(paper => ({
          ...paper,
          uploaderName: profileMap.get(paper.user_id)?.name || null,
          uploaderAvatar: profileMap.get(paper.user_id)?.avatar || null,
        }));

        setPapers(papersWithUploaders);
      } else {
        setPapers([]);
      }
    } catch (err) {
      console.error('Error fetching trending papers:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch trending papers'));
    } finally {
      setLoading(false);
    }
  }, [timeFrame, limit]);

  useEffect(() => {
    fetchTrendingPapers();
  }, [fetchTrendingPapers]);

  return { papers, loading, error, refetch: fetchTrendingPapers };
}
