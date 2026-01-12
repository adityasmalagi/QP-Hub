import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface SimilarPaper {
  id: string;
  title: string;
  subject: string;
  board: string;
  class_level: string;
  year: number;
  views_count: number;
  downloads_count: number;
}

interface SimilarPapersProps {
  paperId: string;
  subject: string;
  classLevel: string;
  board: string;
  year: number;
  className?: string;
}

export function SimilarPapers({ 
  paperId, 
  subject, 
  classLevel, 
  board, 
  year,
  className 
}: SimilarPapersProps) {
  const [papers, setPapers] = useState<SimilarPaper[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSimilarPapers();
  }, [paperId, subject, classLevel, board]);

  const fetchSimilarPapers = async () => {
    setLoading(true);
    try {
      // First try: same subject + same class level
      let { data, error } = await supabase
        .from('question_papers')
        .select('id, title, subject, board, class_level, year, views_count, downloads_count')
        .eq('status', 'approved')
        .eq('subject', subject)
        .eq('class_level', classLevel)
        .neq('id', paperId)
        .order('views_count', { ascending: false })
        .limit(6);

      if (error) throw error;

      // If not enough results, try same board + class level
      if (!data || data.length < 4) {
        const { data: boardData, error: boardError } = await supabase
          .from('question_papers')
          .select('id, title, subject, board, class_level, year, views_count, downloads_count')
          .eq('status', 'approved')
          .eq('board', board)
          .eq('class_level', classLevel)
          .neq('id', paperId)
          .order('views_count', { ascending: false })
          .limit(6);

        if (!boardError && boardData) {
          // Merge and deduplicate
          const existingIds = new Set(data?.map(p => p.id) || []);
          const newPapers = boardData.filter(p => !existingIds.has(p.id));
          data = [...(data || []), ...newPapers].slice(0, 6);
        }
      }

      setPapers(data || []);
    } catch (error) {
      console.error('Error fetching similar papers:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg">Similar Papers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (papers.length === 0) {
    return null;
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <FileText className="h-5 w-5 text-primary" />
          Similar Papers
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {papers.map((paper) => (
            <Link
              key={paper.id}
              to={`/paper/${paper.id}`}
              className="group block"
            >
              <div className="rounded-lg border border-border bg-card p-3 transition-all hover:border-primary/50 hover:shadow-md">
                <h4 className="mb-2 line-clamp-2 text-sm font-medium text-foreground group-hover:text-primary">
                  {paper.title}
                </h4>
                <div className="flex flex-wrap gap-1">
                  <Badge variant="secondary" className="text-[10px]">
                    {paper.subject}
                  </Badge>
                  <Badge variant="outline" className="text-[10px]">
                    {paper.year}
                  </Badge>
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{paper.views_count} views</span>
                  <ArrowRight className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
