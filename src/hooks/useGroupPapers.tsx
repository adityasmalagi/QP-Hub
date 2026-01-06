import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface GroupPaper {
  id: string;
  group_id: string;
  paper_id: string;
  shared_by: string | null;
  note: string | null;
  shared_at: string;
  paper_title?: string;
  paper_subject?: string;
  paper_year?: number;
  paper_board?: string;
  sharer_name?: string | null;
}

export function useGroupPapers(groupId: string | undefined) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [papers, setPapers] = useState<GroupPaper[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPapers = useCallback(async () => {
    if (!groupId) return;

    try {
      const { data: groupPapers, error } = await supabase
        .from('group_papers')
        .select('*')
        .eq('group_id', groupId)
        .order('shared_at', { ascending: false });

      if (error) throw error;

      if (!groupPapers?.length) {
        setPapers([]);
        return;
      }

      // Get paper details
      const paperIds = groupPapers.map(gp => gp.paper_id);
      const sharerIds = [...new Set(groupPapers.filter(gp => gp.shared_by).map(gp => gp.shared_by!))];

      const { data: papersData } = await supabase
        .from('question_papers')
        .select('id, title, subject, year, board')
        .in('id', paperIds);

      let profiles: Record<string, string | null> = {};
      if (sharerIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('public_profiles')
          .select('id, full_name')
          .in('id', sharerIds);

        profilesData?.forEach(p => {
          profiles[p.id] = p.full_name;
        });
      }

      const paperMap = new Map(papersData?.map(p => [p.id, p]) || []);

      const enrichedPapers = groupPapers.map(gp => {
        const paper = paperMap.get(gp.paper_id);
        return {
          ...gp,
          paper_title: paper?.title,
          paper_subject: paper?.subject,
          paper_year: paper?.year,
          paper_board: paper?.board,
          sharer_name: gp.shared_by ? profiles[gp.shared_by] : null,
        };
      });

      setPapers(enrichedPapers);
    } catch (error) {
      console.error('Error fetching group papers:', error);
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    fetchPapers();
  }, [fetchPapers]);

  const sharePaper = async (paperId: string, note?: string) => {
    if (!user || !groupId) {
      toast({
        title: 'Error',
        description: 'Unable to share paper',
        variant: 'destructive',
      });
      return false;
    }

    try {
      const { error } = await supabase.from('group_papers').insert({
        group_id: groupId,
        paper_id: paperId,
        shared_by: user.id,
        note: note || null,
      });

      if (error) {
        if (error.code === '23505') {
          toast({
            title: 'Already shared',
            description: 'This paper is already in the group',
          });
          return false;
        }
        throw error;
      }

      toast({ title: 'Paper shared to group!' });
      fetchPapers();
      return true;
    } catch (error) {
      console.error('Error sharing paper:', error);
      toast({
        title: 'Error',
        description: 'Failed to share paper',
        variant: 'destructive',
      });
      return false;
    }
  };

  const removePaper = async (groupPaperId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('group_papers')
        .delete()
        .eq('id', groupPaperId);

      if (error) throw error;

      toast({ title: 'Paper removed from group' });
      fetchPapers();
      return true;
    } catch (error) {
      console.error('Error removing paper:', error);
      return false;
    }
  };

  return {
    papers,
    loading,
    sharePaper,
    removePaper,
    refetch: fetchPapers,
  };
}
