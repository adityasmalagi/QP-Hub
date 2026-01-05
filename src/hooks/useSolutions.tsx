import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface Solution {
  id: string;
  question_paper_id: string;
  solution_file_url: string;
  solution_file_name: string;
  uploaded_by: string;
  description: string | null;
  is_verified: boolean;
  upvotes_count: number;
  created_at: string;
  uploader_name?: string | null;
  has_upvoted?: boolean;
}

export function useSolutions(paperId: string) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [solutions, setSolutions] = useState<Solution[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const fetchSolutions = async () => {
    try {
      const { data: solutionsData, error } = await supabase
        .from('solution_papers')
        .select('*')
        .eq('question_paper_id', paperId)
        .order('upvotes_count', { ascending: false });

      if (error) throw error;

      // Fetch uploader names and user upvotes
      const enrichedSolutions = await Promise.all(
        (solutionsData || []).map(async (solution) => {
          // Get uploader name
          const { data: profile } = await supabase
            .from('public_profiles')
            .select('full_name')
            .eq('id', solution.uploaded_by)
            .maybeSingle();

          // Check if user has upvoted
          let hasUpvoted = false;
          if (user) {
            const { data: upvote } = await supabase
              .from('solution_upvotes')
              .select('id')
              .eq('solution_id', solution.id)
              .eq('user_id', user.id)
              .maybeSingle();
            hasUpvoted = !!upvote;
          }

          return {
            ...solution,
            uploader_name: profile?.full_name,
            has_upvoted: hasUpvoted,
          };
        })
      );

      setSolutions(enrichedSolutions);
    } catch (error) {
      console.error('Error fetching solutions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSolutions();
  }, [paperId, user]);

  const uploadSolution = async (file: File, description?: string) => {
    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to upload a solution',
        variant: 'destructive',
      });
      return false;
    }

    setUploading(true);
    try {
      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${paperId}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('question-papers')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('question-papers')
        .getPublicUrl(fileName);

      // Create solution record
      const { error: insertError } = await supabase
        .from('solution_papers')
        .insert({
          question_paper_id: paperId,
          solution_file_url: urlData.publicUrl,
          solution_file_name: file.name,
          uploaded_by: user.id,
          description: description || null,
        });

      if (insertError) throw insertError;

      toast({
        title: 'Solution uploaded',
        description: 'Your solution has been uploaded successfully',
      });

      fetchSolutions();
      return true;
    } catch (error) {
      console.error('Error uploading solution:', error);
      toast({
        title: 'Upload failed',
        description: 'Could not upload the solution. Please try again.',
        variant: 'destructive',
      });
      return false;
    } finally {
      setUploading(false);
    }
  };

  const toggleUpvote = async (solutionId: string) => {
    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to upvote',
        variant: 'destructive',
      });
      return;
    }

    const solution = solutions.find((s) => s.id === solutionId);
    if (!solution) return;

    try {
      if (solution.has_upvoted) {
        await supabase
          .from('solution_upvotes')
          .delete()
          .eq('solution_id', solutionId)
          .eq('user_id', user.id);
      } else {
        await supabase
          .from('solution_upvotes')
          .insert({ solution_id: solutionId, user_id: user.id });
      }

      fetchSolutions();
    } catch (error) {
      console.error('Error toggling upvote:', error);
    }
  };

  const deleteSolution = async (solutionId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('solution_papers')
        .delete()
        .eq('id', solutionId)
        .eq('uploaded_by', user.id);

      if (error) throw error;

      toast({
        title: 'Solution deleted',
        description: 'Your solution has been removed',
      });

      fetchSolutions();
    } catch (error) {
      console.error('Error deleting solution:', error);
    }
  };

  return {
    solutions,
    loading,
    uploading,
    uploadSolution,
    toggleUpvote,
    deleteSolution,
    refetch: fetchSolutions,
  };
}
