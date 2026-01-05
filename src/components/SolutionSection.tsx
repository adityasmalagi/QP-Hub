import { useState, useRef } from 'react';
import { useSolutions } from '@/hooks/useSolutions';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  FileCheck, 
  Upload, 
  ThumbsUp, 
  Download, 
  Trash2, 
  Loader2,
  CheckCircle,
  User,
  ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SolutionSectionProps {
  paperId: string;
  className?: string;
}

export function SolutionSection({ paperId, className }: SolutionSectionProps) {
  const { user } = useAuth();
  const { 
    solutions, 
    loading, 
    uploading, 
    uploadSolution, 
    toggleUpvote, 
    deleteSolution 
  } = useSolutions(paperId);
  
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [description, setDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    
    const success = await uploadSolution(selectedFile, description);
    if (success) {
      setShowUploadForm(false);
      setSelectedFile(null);
      setDescription('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDownload = async (url: string, fileName: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Download error:', error);
    }
  };

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileCheck className="h-5 w-5 text-primary" />
            Solutions & Answer Keys
            {solutions.length > 0 && (
              <Badge variant="secondary">{solutions.length}</Badge>
            )}
          </CardTitle>
          {user && !showUploadForm && (
            <Button 
              size="sm" 
              onClick={() => setShowUploadForm(true)}
              className="gradient-primary"
            >
              <Upload className="mr-2 h-4 w-4" />
              Upload Solution
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload Form */}
        {showUploadForm && (
          <div className="rounded-lg border bg-muted/30 p-4 space-y-4">
            <div>
              <label className="text-sm font-medium">Solution File (PDF, Image, or Document)</label>
              <Input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                onChange={handleFileSelect}
                className="mt-1"
              />
              {selectedFile && (
                <p className="mt-1 text-sm text-muted-foreground">
                  Selected: {selectedFile.name}
                </p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium">Description (optional)</label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add any notes about this solution..."
                className="mt-1"
                rows={2}
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleUpload}
                disabled={!selectedFile || uploading}
                className="gradient-primary"
              >
                {uploading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="mr-2 h-4 w-4" />
                )}
                {uploading ? 'Uploading...' : 'Upload'}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowUploadForm(false);
                  setSelectedFile(null);
                  setDescription('');
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Solutions List */}
        {!loading && solutions.length === 0 && !showUploadForm && (
          <div className="text-center py-8 text-muted-foreground">
            <FileCheck className="mx-auto h-12 w-12 mb-2 opacity-50" />
            <p>No solutions uploaded yet</p>
            {user && (
              <p className="text-sm mt-1">Be the first to upload a solution!</p>
            )}
          </div>
        )}

        {!loading && solutions.length > 0 && (
          <div className="space-y-3">
            {solutions.map((solution) => (
              <div
                key={solution.id}
                className="flex items-start gap-4 rounded-lg border p-4 hover:bg-muted/30 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium truncate">
                      {solution.solution_file_name}
                    </span>
                    {solution.is_verified && (
                      <Badge variant="default" className="bg-green-500">
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Verified
                      </Badge>
                    )}
                  </div>
                  {solution.description && (
                    <p className="text-sm text-muted-foreground mb-2">
                      {solution.description}
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {solution.uploader_name || 'Anonymous'}
                    </span>
                    <span>
                      {new Date(solution.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleUpvote(solution.id)}
                    className={cn(
                      'flex items-center gap-1',
                      solution.has_upvoted && 'text-primary'
                    )}
                  >
                    <ThumbsUp 
                      className={cn(
                        'h-4 w-4',
                        solution.has_upvoted && 'fill-current'
                      )} 
                    />
                    {solution.upvotes_count}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => window.open(solution.solution_file_url, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDownload(solution.solution_file_url, solution.solution_file_name)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  {user?.id === solution.uploaded_by && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => deleteSolution(solution.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
