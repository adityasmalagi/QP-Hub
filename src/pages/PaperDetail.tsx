import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { ArrowLeft, Download, Eye, Calendar, FileText, Loader2, User, Building2, Image, Images, FileType, Archive } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { BookmarkButton } from '@/components/BookmarkButton';
import { PDFViewer } from '@/components/PDFViewer';
import { ImageViewer } from '@/components/ImageViewer';
import { ImageGalleryViewer } from '@/components/ImageGalleryViewer';
import { DocViewer } from '@/components/DocViewer';
import JSZip from 'jszip';

type FileViewType = 'pdf' | 'image' | 'gallery' | 'docx' | 'unknown';

// Helper to detect file type from URL or filename
const getFileType = (fileUrl: string, fileName: string, additionalUrls?: string[], storedFileType?: string | null): FileViewType => {
  const url = fileUrl.toLowerCase();
  const name = fileName.toLowerCase();
  
  // Check if it's a gallery (multiple images)
  if (additionalUrls && additionalUrls.length > 0) {
    return 'gallery';
  }
  
  // Use stored file type if it's 'gallery'
  if (storedFileType === 'gallery') {
    return 'gallery';
  }
  
  // Check for Word documents
  if (url.includes('.docx') || url.includes('.doc') || name.endsWith('.docx') || name.endsWith('.doc')) {
    return 'docx';
  }
  
  // Check for image extensions - prioritize URL detection over stored type
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'];
  if (imageExtensions.some(ext => url.includes(ext) || name.endsWith(ext))) {
    return 'image';
  }
  
  // Check for PDF
  if (url.includes('.pdf') || name.endsWith('.pdf')) {
    return 'pdf';
  }
  
  // Try to detect from content-type in URL params
  if (url.includes('image/') || url.includes('image%2F')) {
    return 'image';
  }
  
  return 'pdf'; // Default to PDF for backwards compatibility
};

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
  institute_name: string | null;
  user_id: string;
  file_type: string | null;
  additional_file_urls: string[] | null;
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
        .select('id, title, description, subject, board, class_level, year, exam_type, file_url, file_name, views_count, downloads_count, created_at, semester, internal_number, institute_name, user_id, file_type, additional_file_urls')
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
  const [downloadingZip, setDownloadingZip] = useState(false);
  // Determine file type
  const fileType = paper ? getFileType(paper.file_url, paper.file_name, paper.additional_file_urls || undefined, paper.file_type) : 'pdf';

  // Get all image URLs for gallery
  const galleryUrls = paper && fileType === 'gallery' 
    ? [paper.file_url, ...(paper.additional_file_urls || [])]
    : [];

  const getDownloadButtonText = () => {
    if (downloading) return 'Downloading...';
    if (fileType === 'gallery') return 'Download All Images';
    if (fileType === 'image') return 'Download Image';
    if (fileType === 'docx') return 'Download Document';
    return 'Download PDF';
  };

  const getFileIcon = () => {
    switch (fileType) {
      case 'gallery': return <Images className="mr-2 h-4 w-4" />;
      case 'image': return <Image className="mr-2 h-4 w-4" />;
      case 'docx': return <FileType className="mr-2 h-4 w-4" />;
      default: return <Download className="mr-2 h-4 w-4" />;
    }
  };

  const handleDownload = async () => {
    if (!paper || downloading) return;
    
    setDownloading(true);
    try {
      // For gallery, download all images
      const urlsToDownload = fileType === 'gallery' 
        ? [paper.file_url, ...(paper.additional_file_urls || [])]
        : [paper.file_url];
      
      for (let i = 0; i < urlsToDownload.length; i++) {
        const url = urlsToDownload[i];
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch file');
        
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        
        // Generate filename
        const ext = url.split('.').pop()?.split('?')[0] || 'png';
        if (urlsToDownload.length > 1) {
          link.download = `${paper.title}_${i + 1}.${ext}`;
        } else {
          link.download = paper.file_name || `${paper.title}.${ext}`;
        }
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);
        
        // Small delay between downloads
        if (i < urlsToDownload.length - 1) {
          await new Promise(r => setTimeout(r, 300));
        }
      }

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

  const handleDownloadZip = async () => {
    if (!paper || downloadingZip || fileType !== 'gallery') return;
    
    setDownloadingZip(true);
    try {
      const urlsToDownload = [paper.file_url, ...(paper.additional_file_urls || [])];
      const zip = new JSZip();
      
      // Fetch all images and add to zip
      for (let i = 0; i < urlsToDownload.length; i++) {
        const url = urlsToDownload[i];
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to fetch page ${i + 1}`);
        
        const blob = await response.blob();
        const ext = url.split('.').pop()?.split('?')[0] || 'png';
        zip.file(`${paper.title}_page_${i + 1}.${ext}`, blob);
      }
      
      // Generate and download zip
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const downloadUrl = window.URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${paper.title}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      // Increment download count
      await supabase.rpc('increment_downloads', { _paper_id: paper.id });

      if (user) {
        await supabase
          .from('user_downloads')
          .upsert({
            user_id: user.id,
            paper_id: paper.id,
            downloaded_at: new Date().toISOString()
          }, { onConflict: 'user_id,paper_id' });
      }
      
      toast({
        title: 'Download complete',
        description: `All ${urlsToDownload.length} pages downloaded as ZIP.`,
      });
    } catch (error) {
      console.error('ZIP download error:', error);
      toast({
        title: 'Download failed',
        description: 'Could not create ZIP file. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setDownloadingZip(false);
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
              {paper.institute_name && (
                <span className="flex items-center gap-1">
                  <Building2 className="h-4 w-4" />
                  {paper.institute_name}
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-3">
              <Button onClick={handleDownload} className="gradient-primary" disabled={downloading || downloadingZip}>
                {downloading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  getFileIcon()
                )}
                {getDownloadButtonText()}
              </Button>
              {fileType === 'gallery' && (
                <Button 
                  variant="secondary" 
                  onClick={handleDownloadZip} 
                  disabled={downloading || downloadingZip}
                >
                  {downloadingZip ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Archive className="mr-2 h-4 w-4" />
                  )}
                  {downloadingZip ? 'Creating ZIP...' : 'Download as ZIP'}
                </Button>
              )}
              {fileType !== 'docx' && (
                <Button
                  variant="outline"
                  onClick={() => window.open(paper.file_url, '_blank')}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  Open in New Tab
                </Button>
              )}
              <BookmarkButton paperId={paper.id} variant="button" />
            </div>
          </CardContent>
        </Card>

        {/* File Viewer - PDF, Image, Gallery, or Document */}
        {fileType === 'gallery' ? (
          <ImageGalleryViewer
            fileUrls={galleryUrls}
            title={paper.title}
            className="min-h-[600px]"
          />
        ) : fileType === 'image' ? (
          <ImageViewer
            fileUrl={paper.file_url}
            title={paper.title}
            className="min-h-[600px]"
          />
        ) : fileType === 'docx' ? (
          <DocViewer
            fileUrl={paper.file_url}
            fileName={paper.file_name}
            title={paper.title}
            className="min-h-[400px]"
            onDownload={handleDownload}
          />
        ) : (
          <PDFViewer
            fileUrl={paper.file_url}
            title={paper.title}
            className="min-h-[600px]"
          />
        )}
      </div>
    </div>
  );
}
