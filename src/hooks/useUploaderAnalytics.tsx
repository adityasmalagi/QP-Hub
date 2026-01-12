import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface PaperStats {
  id: string;
  title: string;
  subject: string;
  views_count: number;
  downloads_count: number;
  upvotes_count: number;
  downvotes_count: number;
  created_at: string;
}

interface AnalyticsData {
  totalPapers: number;
  totalViews: number;
  totalDownloads: number;
  totalUpvotes: number;
  totalDownvotes: number;
  engagementRate: number;
  topPapers: PaperStats[];
  viewsOverTime: { date: string; views: number }[];
  subjectBreakdown: { subject: string; count: number }[];
}

export function useUploaderAnalytics() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    if (!user) {
      setAnalytics(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Fetch all papers by the user
      const { data: papers, error: papersError } = await supabase
        .from('question_papers')
        .select('id, title, subject, views_count, downloads_count, upvotes_count, downvotes_count, created_at')
        .eq('user_id', user.id)
        .eq('status', 'approved')
        .order('views_count', { ascending: false });

      if (papersError) throw papersError;

      if (!papers || papers.length === 0) {
        setAnalytics({
          totalPapers: 0,
          totalViews: 0,
          totalDownloads: 0,
          totalUpvotes: 0,
          totalDownvotes: 0,
          engagementRate: 0,
          topPapers: [],
          viewsOverTime: [],
          subjectBreakdown: [],
        });
        setLoading(false);
        return;
      }

      // Calculate totals
      const totalViews = papers.reduce((sum, p) => sum + (p.views_count || 0), 0);
      const totalDownloads = papers.reduce((sum, p) => sum + (p.downloads_count || 0), 0);
      const totalUpvotes = papers.reduce((sum, p) => sum + (p.upvotes_count || 0), 0);
      const totalDownvotes = papers.reduce((sum, p) => sum + (p.downvotes_count || 0), 0);
      const engagementRate = totalViews > 0 ? (totalDownloads / totalViews) * 100 : 0;

      // Subject breakdown
      const subjectMap = new Map<string, number>();
      papers.forEach(p => {
        subjectMap.set(p.subject, (subjectMap.get(p.subject) || 0) + 1);
      });
      const subjectBreakdown = Array.from(subjectMap.entries())
        .map(([subject, count]) => ({ subject, count }))
        .sort((a, b) => b.count - a.count);

      // Views over time (last 30 days simulation based on paper creation)
      const viewsOverTime: { date: string; views: number }[] = [];
      const now = new Date();
      for (let i = 29; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        // Simulate distribution based on creation dates
        const dailyViews = papers.reduce((sum, p) => {
          const createdDate = new Date(p.created_at);
          if (createdDate <= date) {
            return sum + Math.floor((p.views_count || 0) / 30);
          }
          return sum;
        }, 0);
        viewsOverTime.push({ date: dateStr, views: dailyViews });
      }

      setAnalytics({
        totalPapers: papers.length,
        totalViews,
        totalDownloads,
        totalUpvotes,
        totalDownvotes,
        engagementRate,
        topPapers: papers.slice(0, 5),
        viewsOverTime,
        subjectBreakdown,
      });
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return {
    analytics,
    loading,
    error,
    refresh: fetchAnalytics,
  };
}
