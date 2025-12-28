import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { ArrowLeft, Download, Eye, Calendar, FileText, Loader2, User } from 'lucide-react';
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
  user_id: string;
}

export default function PaperDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [paper, setPaper] = useState<Paper | null>(null);
  const [uploaderName, setUploaderName] = useState<string | null>(null);
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
        .select('id, title, description, subject, board, class_level, year, exam_type, file_url, file_name, views_count, downloads_count, created_at, semester, internal_number, user_id')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setPaper(data);
        // Increment view count atomically
        await supabase.rpc('increment_views', { _paper_id: id });
        
        // Fetch uploader name
        if (data.user_id) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', data.user_id)
            .maybeSingle();
          
          if (profileData) {
            setUploaderName(profileData.full_name);
          }
        }
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

  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    if (!paper || downloading) return;
    
    setDownloading(true);
    try {
      // Fetch the file as blob
      const response = await fetch(paper.file_url);
      if (!response.ok) throw new Error('Failed to fetch file');
      
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = paper.file_name || `${paper.title}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

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
      
      toast({
        title: 'Download started',
        description: 'Your file is being downloaded.',
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: 'Download failed',
        description: 'Could not download the file. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setDownloading(false);
    }
  };

  const getExamTypeDisplay = () => {
    if (!paper) return '';
    
    if (paper.exam_type === 'sem_paper' && paper.semester) {
      return `SEM ${paper.semester} Paper`;
    } else if (paper.exam_type === 'internals' && paper.internal_number) {
      return `Internal ${paper.internal_number}`;
    }
    
    return paper.exam_type.replace('_', ' ');
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
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <div className="container mx-auto max-w-4xl px-4 py-8 pb-12 flex-1 animate-fade-in">
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
              {uploaderName && (
                <Link 
                  to={`/user/${paper.user_id}`}
                  className="flex items-center gap-1 hover:text-primary transition-colors"
                >
                  <User className="h-4 w-4" />
                  Uploaded by {uploaderName}
                </Link>
              )}
            </div>

            <div className="flex flex-wrap gap-3">
              <Button onClick={handleDownload} className="gradient-primary" disabled={downloading}>
                {downloading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                {downloading ? 'Downloading...' : 'Download PDF'}
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
