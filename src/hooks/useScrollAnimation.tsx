import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import React from 'react';
import { cn } from '@/lib/utils';

interface UseScrollAnimationOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
}

/**
 * Shared IntersectionObserver pool.
 * Instead of creating one observer per element (expensive on long pages),
 * we keep a single observer per unique (threshold, rootMargin) key and
 * dispatch entries to per-element callbacks. This batches browser work
 * and lets the engine process many entries in a single callback tick.
 */
type Cb = (isIntersecting: boolean) => void;
const observerPool = new Map<string, { observer: IntersectionObserver; callbacks: WeakMap<Element, Cb> }>();

function getPooledObserver(threshold: number, rootMargin: string) {
  const key = `${threshold}|${rootMargin}`;
  let entry = observerPool.get(key);
  if (entry) return entry;

  const callbacks = new WeakMap<Element, Cb>();
  const observer = new IntersectionObserver(
    (entries) => {
      // Single batched pass over all entries
      for (let i = 0; i < entries.length; i++) {
        const e = entries[i];
        const cb = callbacks.get(e.target);
        if (cb) cb(e.isIntersecting);
      }
    },
    { threshold, rootMargin }
  );

  entry = { observer, callbacks };
  observerPool.set(key, entry);
  return entry;
}

export function useScrollAnimation<T extends HTMLElement = HTMLDivElement>(
  options: UseScrollAnimationOptions = {}
) {
  const { threshold = 0.15, rootMargin = '0px 0px -10% 0px', triggerOnce = true } = options;
  const ref = useRef<T>(null);
  const [isVisible, setIsVisible] = useState(false);
  const hasTriggeredRef = useRef(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    if (hasTriggeredRef.current) {
      // Already animated in — no need to observe again
      return;
    }

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion || typeof IntersectionObserver === 'undefined') {
      setIsVisible(true);
      hasTriggeredRef.current = true;
      return;
    }

    const { observer, callbacks } = getPooledObserver(threshold, rootMargin);

    const cb: Cb = (intersecting) => {
      if (intersecting) {
        // Skip state update if already visible (prevents redundant re-renders)
        if (!hasTriggeredRef.current) {
          hasTriggeredRef.current = true;
          setIsVisible(true);
        }
        if (triggerOnce) {
          callbacks.delete(element);
          observer.unobserve(element);
        }
      } else if (!triggerOnce) {
        setIsVisible(false);
      }
    };

    callbacks.set(element, cb);
    observer.observe(element);

    return () => {
      callbacks.delete(element);
      observer.unobserve(element);
    };
  }, [threshold, rootMargin, triggerOnce]);

  return { ref, isVisible };
}

// Hoisted: no per-render allocation
const ANIMATION_CLASSES = {
  'fade-up': { initial: 'opacity-0 translate-y-6', visible: 'opacity-100 translate-y-0' },
  'fade-in': { initial: 'opacity-0', visible: 'opacity-100' },
  'scale-in': { initial: 'opacity-0 scale-95', visible: 'opacity-100 scale-100' },
  'slide-left': { initial: 'opacity-0 translate-x-6', visible: 'opacity-100 translate-x-0' },
  'slide-right': { initial: 'opacity-0 -translate-x-6', visible: 'opacity-100 translate-x-0' },
} as const;

interface ScrollAnimationProps {
  children: React.ReactNode;
  className?: string;
  animation?: keyof typeof ANIMATION_CLASSES;
  delay?: number;
  duration?: number;
  threshold?: number;
  triggerOnce?: boolean;
}

function ScrollAnimationImpl({
  children,
  className,
  animation = 'fade-up',
  delay = 0,
  duration = 500,
  threshold = 0.15,
  triggerOnce = true,
}: ScrollAnimationProps) {
  const { ref, isVisible } = useScrollAnimation<HTMLDivElement>({ threshold, triggerOnce });
  const { initial, visible } = ANIMATION_CLASSES[animation];

  // Drop will-change after the animation finishes so the compositor layer can be released
  const [animationDone, setAnimationDone] = useState(false);
  const handleTransitionEnd = useCallback(() => {
    if (isVisible) setAnimationDone(true);
  }, [isVisible]);

  const style = useMemo(
    () => ({
      transitionDuration: `${duration}ms`,
      transitionDelay: isVisible ? `${delay}ms` : '0ms',
      willChange: isVisible && !animationDone ? 'opacity, transform' : 'auto',
    }),
    [duration, delay, isVisible, animationDone]
  );

  return (
    <div
      ref={ref}
      onTransitionEnd={handleTransitionEnd}
      className={cn(
        'transition-all ease-out motion-reduce:transition-none',
        isVisible ? visible : initial,
        className
      )}
      style={style}
    >
      {children}
    </div>
  );
}

export const ScrollAnimation = React.memo(ScrollAnimationImpl);
