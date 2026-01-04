import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize2, RotateCw, Loader2, Grid3X3 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageGalleryViewerProps {
  fileUrls: string[];
  title?: string;
  className?: string;
}

export function ImageGalleryViewer({ fileUrls, title, className }: ImageGalleryViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [scale, setScale] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showThumbnails, setShowThumbnails] = useState(false);

  const zoomIn = () => setScale(prev => Math.min(prev + 0.25, 3));
  const zoomOut = () => setScale(prev => Math.max(prev - 0.25, 0.25));
  const rotate = () => setRotation(prev => (prev + 90) % 360);
  const openFullscreen = () => window.open(fileUrls[currentIndex], '_blank');

  const goToPrevious = () => {
    setCurrentIndex(prev => (prev === 0 ? fileUrls.length - 1 : prev - 1));
    setScale(1);
    setRotation(0);
    setLoading(true);
  };

  const goToNext = () => {
    setCurrentIndex(prev => (prev === fileUrls.length - 1 ? 0 : prev + 1));
    setScale(1);
    setRotation(0);
    setLoading(true);
  };

  const goToIndex = (index: number) => {
    setCurrentIndex(index);
    setScale(1);
    setRotation(0);
    setLoading(true);
    setShowThumbnails(false);
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
        <Button variant="outline" onClick={() => window.open(fileUrls[currentIndex], '_blank')}>
          Open in New Tab
        </Button>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col rounded-lg border border-border bg-card overflow-hidden', className)}>
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-muted/50 px-2 py-2 md:px-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {title || 'Gallery'} - Page {currentIndex + 1} of {fileUrls.length}
          </span>
        </div>

        <div className="flex items-center gap-1 md:gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowThumbnails(!showThumbnails)}
            className="h-8 w-8 p-0 md:h-9 md:w-auto md:px-3"
            title="Show thumbnails"
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={zoomOut} disabled={scale <= 0.25} className="h-8 w-8 p-0" title="Zoom Out">
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="min-w-[40px] text-center text-xs text-muted-foreground">
            {Math.round(scale * 100)}%
          </span>
          <Button variant="outline" size="sm" onClick={zoomIn} disabled={scale >= 3} className="h-8 w-8 p-0" title="Zoom In">
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={rotate} className="h-8 w-8 p-0" title="Rotate">
            <RotateCw className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={openFullscreen} className="h-8 w-8 p-0" title="Open in new tab">
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Thumbnails panel */}
      {showThumbnails && (
        <div className="border-b border-border bg-muted/30 p-2 overflow-x-auto">
          <div className="flex gap-2">
            {fileUrls.map((url, index) => (
              <button
                key={index}
                onClick={() => goToIndex(index)}
                className={cn(
                  'relative flex-shrink-0 w-16 h-16 rounded overflow-hidden border-2 transition-all',
                  index === currentIndex ? 'border-primary ring-2 ring-primary/30' : 'border-border hover:border-primary/50'
                )}
              >
                <img
                  src={url}
                  alt={`Page ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                <span className="absolute bottom-0 left-0 right-0 bg-background/80 text-[10px] text-center">
                  {index + 1}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Image Display with Navigation */}
      <div className="relative flex-1 overflow-auto bg-muted/30 p-2 md:p-4" style={{ minHeight: '70vh' }}>
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {/* Left Arrow */}
        {fileUrls.length > 1 && (
          <Button
            variant="outline"
            size="icon"
            onClick={goToPrevious}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-20 h-10 w-10 rounded-full bg-background/80 hover:bg-background"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
        )}

        {/* Right Arrow */}
        {fileUrls.length > 1 && (
          <Button
            variant="outline"
            size="icon"
            onClick={goToNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-20 h-10 w-10 rounded-full bg-background/80 hover:bg-background"
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
        )}

        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="relative">
            <img
              key={currentIndex}
              src={fileUrls[currentIndex]}
              alt={`${title || 'Question Paper'} - Page ${currentIndex + 1}`}
              onLoad={handleLoad}
              onError={handleError}
              className="max-w-full shadow-lg transition-transform duration-200"
              style={{
                transform: `scale(${scale}) rotate(${rotation}deg)`,
                transformOrigin: 'center center',
              }}
            />
            {/* Page number overlay */}
            <div className="absolute top-3 right-3 bg-background/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-md border border-border">
              <span className="text-sm font-medium text-foreground">
                Page {currentIndex + 1} / {fileUrls.length}
              </span>
            </div>
          </div>
        </div>

        {/* Page indicator dots */}
        {fileUrls.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 bg-background/80 px-3 py-2 rounded-full">
            {fileUrls.map((_, index) => (
              <button
                key={index}
                onClick={() => goToIndex(index)}
                className={cn(
                  'w-2.5 h-2.5 rounded-full transition-all',
                  index === currentIndex 
                    ? 'bg-primary scale-125' 
                    : 'bg-muted-foreground/40 hover:bg-muted-foreground/60'
                )}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
