import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { ArrowLeft, Download, Eye, Calendar, FileText, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { BookmarkButton } from '@/components/BookmarkButton';
import { PDFViewer } from '@/components/PDFViewer';

interface Paper {
  id: string;
  title: string;
  description: string | null;
  subject: string;
  board: string;
  class_level: string;
  year: number;
  exam_type: string;
  file_url: string;
  file_name: string;
  views_count: number;
  downloads_count: number;
  created_at: string;
  semester: number | null;
  internal_number: number | null;
}

export default function PaperDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [paper, setPaper] = useState<Paper | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (id) {
      fetchPaper();
    }
  }, [id]);

  const fetchPaper = async () => {
    try {
      const { data, error } = await supabase
        .from('question_papers')
        .select('id, title, description, subject, board, class_level, year, exam_type, file_url, file_name, views_count, downloads_count, created_at, semester, internal_number')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setPaper(data);
        // Increment view count atomically
        await supabase.rpc('increment_views', { _paper_id: id });
      }
    } catch (error) {
      console.error('Error fetching paper:', error);
      toast({
        title: 'Error',
        description: 'Failed to load the question paper',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!paper) return;
    
    try {
      // Increment download count atomically
      await supabase.rpc('increment_downloads', { _paper_id: paper.id });

      // Track download for logged-in users
      if (user) {
        await supabase
          .from('user_downloads')
          .upsert({
            user_id: user.id,
            paper_id: paper.id,
            downloaded_at: new Date().toISOString()
          }, {
            onConflict: 'user_id,paper_id'
          });
      }
      
      // Open file in new tab
      window.open(paper.file_url, '_blank');
    } catch (error) {
      console.error('Download error:', error);
    }
  };

  const getExamTypeDisplay = () => {
    if (!paper) return '';
    
    let display = paper.exam_type.replace('_', ' ');
    
    if (paper.exam_type === 'sem_paper' && paper.semester) {
      display = `SEM ${paper.semester} Paper`;
    } else if (paper.exam_type === 'internals' && paper.semester && paper.internal_number) {
      display = `SEM ${paper.semester} - Internal ${paper.internal_number}`;
    }
    
    return display;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!paper) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-16 text-center">
          <FileText className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <h1 className="mb-2 text-2xl font-bold text-foreground">Paper not found</h1>
          <p className="mb-6 text-muted-foreground">
            The question paper you're looking for doesn't exist or has been removed.
          </p>
          <Link to="/browse">
            <Button>Browse Papers</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto max-w-4xl px-4 py-8">
        {/* Back Button */}
        <Link
          to="/browse"
          className="mb-6 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Browse
        </Link>

        {/* Paper Info Card */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="mb-4 flex flex-wrap gap-2">
              <Badge variant="secondary" className="text-sm">
                {paper.board.toUpperCase()}
              </Badge>
              <Badge variant="outline">Class {paper.class_level}</Badge>
              <Badge variant="outline">{paper.subject}</Badge>
              <Badge variant="outline">{paper.year}</Badge>
              <Badge variant="outline" className="capitalize">
                {getExamTypeDisplay()}
              </Badge>
            </div>

            <h1 className="mb-4 text-2xl font-bold text-foreground md:text-3xl">
              {paper.title}
            </h1>

            {paper.description && (
              <p className="mb-6 text-muted-foreground">{paper.description}</p>
            )}

            <div className="mb-6 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                {paper.views_count} views
              </span>
              <span className="flex items-center gap-1">
                <Download className="h-4 w-4" />
                {paper.downloads_count} downloads
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {new Date(paper.created_at).toLocaleDateString()}
              </span>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button onClick={handleDownload} className="gradient-primary">
                <Download className="mr-2 h-4 w-4" />
                Download PDF
              </Button>
              <Button
                variant="outline"
                onClick={() => window.open(paper.file_url, '_blank')}
              >
                <Eye className="mr-2 h-4 w-4" />
                Open in New Tab
              </Button>
              <BookmarkButton paperId={paper.id} variant="button" />
            </div>
          </CardContent>
        </Card>

        {/* PDF Viewer */}
        <PDFViewer
          fileUrl={paper.file_url}
          title={paper.title}
          className="min-h-[600px]"
        />
      </div>
    </div>
  );
}
