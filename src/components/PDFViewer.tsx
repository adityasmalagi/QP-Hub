import { useState, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PDFViewerProps {
  fileUrl: string;
  title?: string;
  className?: string;
}

export function PDFViewer({ fileUrl, title, className }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.2);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setLoading(false);
    setError(null);
  }, []);

  const onDocumentLoadError = useCallback((error: Error) => {
    console.error('PDF load error:', error);
    setError('Failed to load PDF. The file may be unavailable or corrupted.');
    setLoading(false);
  }, []);

  const goToPrevPage = () => {
    setPageNumber(prev => Math.max(prev - 1, 1));
  };

  const goToNextPage = () => {
    setPageNumber(prev => Math.min(prev + 1, numPages));
  };

  const zoomIn = () => {
    setScale(prev => Math.min(prev + 0.2, 2.5));
  };

  const zoomOut = () => {
    setScale(prev => Math.max(prev - 0.2, 0.5));
  };

  const openFullscreen = () => {
    window.open(fileUrl, '_blank');
  };

  if (error) {
    return (
      <div className={cn('flex flex-col items-center justify-center rounded-lg border border-border bg-muted/50 p-8', className)}>
        <p className="mb-4 text-center text-muted-foreground">{error}</p>
        <Button variant="outline" onClick={() => window.open(fileUrl, '_blank')}>
          Open in New Tab
        </Button>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col rounded-lg border border-border bg-card overflow-hidden', className)}>
      {/* Controls - Mobile Optimized */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-muted/50 px-2 py-2 md:px-4">
        <div className="flex items-center gap-1 md:gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={goToPrevPage}
            disabled={pageNumber <= 1}
            className="h-8 w-8 p-0 md:h-9 md:w-auto md:px-3"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-[80px] text-center text-xs text-muted-foreground md:text-sm">
            Page {pageNumber} / {numPages || '...'}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={goToNextPage}
            disabled={pageNumber >= numPages}
            className="h-8 w-8 p-0 md:h-9 md:w-auto md:px-3"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-1 md:gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={zoomOut}
            disabled={scale <= 0.5}
            className="h-8 w-8 p-0 md:h-9 md:w-auto md:px-3"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="min-w-[40px] text-center text-xs text-muted-foreground md:min-w-[50px] md:text-sm">
            {Math.round(scale * 100)}%
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={zoomIn}
            disabled={scale >= 2.5}
            className="h-8 w-8 p-0 md:h-9 md:w-auto md:px-3"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={openFullscreen}
            title="Open in new tab"
            className="h-8 w-8 p-0 md:h-9 md:w-auto md:px-3"
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* PDF Document - Improved visibility */}
      <div className="relative flex-1 overflow-auto bg-muted/30 p-2 md:p-4" style={{ minHeight: '70vh' }}>
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}
        
        <div className="flex justify-center">
          <Document
            file={fileUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading={null}
            className="shadow-lg max-w-full"
          >
            <Page
              pageNumber={pageNumber}
              scale={scale}
              renderTextLayer={true}
              renderAnnotationLayer={true}
              className="bg-white max-w-full"
              width={typeof window !== 'undefined' && window.innerWidth < 768 ? window.innerWidth - 40 : undefined}
            />
          </Document>
        </div>
      </div>
    </div>
  );
}
