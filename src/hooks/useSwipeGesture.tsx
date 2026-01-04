import { useRef, useEffect, useCallback } from 'react';

interface UseSwipeGestureOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  threshold?: number;
  enabled?: boolean;
}

export function useSwipeGesture({
  onSwipeLeft,
  onSwipeRight,
  threshold = 50,
  enabled = true,
}: UseSwipeGestureOptions) {
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);
  const touchEndX = useRef<number>(0);
  const isSwiping = useRef<boolean>(false);

  const triggerHaptic = useCallback(() => {
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  }, []);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!enabled) return;
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    isSwiping.current = false;
  }, [enabled]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!enabled) return;
    
    const deltaX = e.touches[0].clientX - touchStartX.current;
    const deltaY = e.touches[0].clientY - touchStartY.current;
    
    // Only consider horizontal swipes (when horizontal movement > vertical)
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
      isSwiping.current = true;
      // Prevent vertical scrolling during horizontal swipe
      e.preventDefault();
    }
    
    touchEndX.current = e.touches[0].clientX;
  }, [enabled]);

  const handleTouchEnd = useCallback(() => {
    if (!enabled || !isSwiping.current) return;
    
    const deltaX = touchEndX.current - touchStartX.current;
    
    if (Math.abs(deltaX) > threshold) {
      if (deltaX < 0) {
        // Swiped left -> go to next
        triggerHaptic();
        onSwipeLeft?.();
      } else {
        // Swiped right -> go to previous
        triggerHaptic();
        onSwipeRight?.();
      }
    }
    
    isSwiping.current = false;
  }, [enabled, threshold, onSwipeLeft, onSwipeRight, triggerHaptic]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !enabled) return;

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [enabled, handleTouchStart, handleTouchMove, handleTouchEnd]);

  return { containerRef };
}
