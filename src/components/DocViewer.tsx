import { Button } from '@/components/ui/button';
import { FileText, Download, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DocViewerProps {
  fileUrl: string;
  fileName?: string;
  title?: string;
  className?: string;
  onDownload?: () => void;
}

export function DocViewer({ fileUrl, fileName, title, className, onDownload }: DocViewerProps) {
  const openInGoogleDocs = () => {
    const googleViewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(fileUrl)}&embedded=true`;
    window.open(googleViewerUrl, '_blank');
  };

  return (
    <div className={cn('flex flex-col rounded-lg border border-border bg-card overflow-hidden', className)}>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-muted/50 px-4 py-3">
        <span className="text-sm text-muted-foreground flex items-center gap-2">
          <FileText className="h-4 w-4" />
          {title || 'Word Document'}
        </span>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={openInGoogleDocs}>
            <ExternalLink className="h-4 w-4 mr-2" />
            Preview in Google Docs
          </Button>
          {onDownload && (
            <Button size="sm" onClick={onDownload} className="gradient-primary">
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          )}
        </div>
      </div>

      {/* Preview area */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-muted/30 min-h-[400px]">
        <div className="bg-background rounded-lg p-8 shadow-sm border border-border max-w-md text-center">
          <div className="mx-auto mb-4 rounded-full bg-primary/10 p-4 w-fit">
            <FileText className="h-12 w-12 text-primary" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Word Document</h3>
          <p className="text-muted-foreground text-sm mb-4">
            {fileName || 'This document'} cannot be previewed directly in the browser.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button variant="outline" onClick={openInGoogleDocs}>
              <ExternalLink className="h-4 w-4 mr-2" />
              Open with Google Docs
            </Button>
            {onDownload && (
              <Button onClick={onDownload} className="gradient-primary">
                <Download className="h-4 w-4 mr-2" />
                Download File
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
