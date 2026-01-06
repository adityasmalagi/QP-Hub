import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface PaperRequest {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  subject: string;
  class_level: string;
  board: string;
  year: number | null;
  exam_type: string | null;
  status: 'open' | 'fulfilled' | 'closed';
  fulfilled_by_paper_id: string | null;
  upvotes_count: number;
  created_at: string;
  requester_name?: string | null;
  has_upvoted?: boolean;
}

interface CreateRequestData {
  title: string;
  description?: string;
  subject: string;
  class_level: string;
  board: string;
  year?: number;
  exam_type?: string;
}

export function usePaperRequests() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<PaperRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async (status?: 'open' | 'fulfilled' | 'closed') => {
    try {
      let query = supabase
        .from('paper_requests')
        .select('*')
        .order('upvotes_count', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Enrich with requester names and upvote status
      const enrichedRequests = await Promise.all(
        (data || []).map(async (request) => {
          const { data: profile } = await supabase
            .from('public_profiles')
            .select('full_name')
            .eq('id', request.user_id)
            .maybeSingle();

          let hasUpvoted = false;
          if (user) {
            const { data: upvote } = await supabase
              .from('request_upvotes')
              .select('id')
              .eq('request_id', request.id)
              .eq('user_id', user.id)
              .maybeSingle();
            hasUpvoted = !!upvote;
          }

          return {
            ...request,
            status: request.status as 'open' | 'fulfilled' | 'closed',
            requester_name: profile?.full_name,
            has_upvoted: hasUpvoted,
          };
        })
      );

      setRequests(enrichedRequests);
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests('open');

    // Subscribe to real-time request updates
    const channel = supabase
      .channel('paper-requests')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'paper_requests',
        },
        () => fetchRequests('open')
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'request_upvotes',
        },
        () => fetchRequests('open')
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const createRequest = async (data: CreateRequestData) => {
    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to request a paper',
        variant: 'destructive',
      });
      return false;
    }

    try {
      const { error } = await supabase.from('paper_requests').insert({
        user_id: user.id,
        title: data.title,
        description: data.description || null,
        subject: data.subject,
        class_level: data.class_level,
        board: data.board,
        year: data.year || null,
        exam_type: data.exam_type || null,
      });

      if (error) throw error;

      toast({
        title: 'Request created',
        description: 'Your paper request has been posted',
      });

      fetchRequests('open');
      return true;
    } catch (error) {
      console.error('Error creating request:', error);
      toast({
        title: 'Error',
        description: 'Could not create request. Please try again.',
        variant: 'destructive',
      });
      return false;
    }
  };

  const toggleUpvote = async (requestId: string) => {
    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to upvote',
        variant: 'destructive',
      });
      return;
    }

    const request = requests.find((r) => r.id === requestId);
    if (!request) return;

    try {
      if (request.has_upvoted) {
        await supabase
          .from('request_upvotes')
          .delete()
          .eq('request_id', requestId)
          .eq('user_id', user.id);
      } else {
        await supabase
          .from('request_upvotes')
          .insert({ request_id: requestId, user_id: user.id });
      }

      fetchRequests('open');
    } catch (error) {
      console.error('Error toggling upvote:', error);
    }
  };

  const fulfillRequest = async (requestId: string, paperId: string) => {
    try {
      const { error } = await supabase
        .from('paper_requests')
        .update({
          status: 'fulfilled',
          fulfilled_by_paper_id: paperId,
        })
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: 'Request fulfilled',
        description: 'The paper request has been marked as fulfilled',
      });

      fetchRequests('open');
    } catch (error) {
      console.error('Error fulfilling request:', error);
    }
  };

  const deleteRequest = async (requestId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('paper_requests')
        .delete()
        .eq('id', requestId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: 'Request deleted',
        description: 'Your request has been removed',
      });

      fetchRequests('open');
    } catch (error) {
      console.error('Error deleting request:', error);
    }
  };

  return {
    requests,
    loading,
    createRequest,
    toggleUpvote,
    fulfillRequest,
    deleteRequest,
    refetch: fetchRequests,
  };
}
