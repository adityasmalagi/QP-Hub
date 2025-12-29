import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, Maximize2, RotateCw, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageViewerProps {
  fileUrl: string;
  title?: string;
  className?: string;
}

export function ImageViewer({ fileUrl, title, className }: ImageViewerProps) {
  const [scale, setScale] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const zoomIn = () => {
    setScale(prev => Math.min(prev + 0.25, 3));
  };

  const zoomOut = () => {
    setScale(prev => Math.max(prev - 0.25, 0.25));
  };

  const rotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const openFullscreen = () => {
    window.open(fileUrl, '_blank');
  };

  const handleLoad = () => {
    setLoading(false);
    setError(null);
  };

  const handleError = () => {
    setError('Failed to load image. The file may be unavailable or corrupted.');
    setLoading(false);
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
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-muted/50 px-2 py-2 md:px-4">
        <span className="text-sm text-muted-foreground">
          {title || 'Image Viewer'}
        </span>

        <div className="flex items-center gap-1 md:gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={zoomOut}
            disabled={scale <= 0.25}
            className="h-8 w-8 p-0 md:h-9 md:w-auto md:px-3"
            title="Zoom Out"
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
            disabled={scale >= 3}
            className="h-8 w-8 p-0 md:h-9 md:w-auto md:px-3"
            title="Zoom In"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={rotate}
            className="h-8 w-8 p-0 md:h-9 md:w-auto md:px-3"
            title="Rotate"
          >
            <RotateCw className="h-4 w-4" />
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

      {/* Image Display */}
      <div className="relative flex-1 overflow-auto bg-muted/30 p-2 md:p-4" style={{ minHeight: '70vh' }}>
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}
        
        <div className="flex justify-center items-center min-h-[60vh]">
          <img
            src={fileUrl}
            alt={title || 'Question Paper'}
            onLoad={handleLoad}
            onError={handleError}
            className="max-w-full shadow-lg transition-transform duration-200"
            style={{
              transform: `scale(${scale}) rotate(${rotation}deg)`,
              transformOrigin: 'center center',
            }}
          />
        </div>
      </div>
    </div>
  );
}
