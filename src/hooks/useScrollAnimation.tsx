import { useEffect, useRef, useState, useMemo } from 'react';
import React from 'react';
import { cn } from '@/lib/utils';

interface UseScrollAnimationOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
}

export function useScrollAnimation<T extends HTMLElement = HTMLDivElement>(
  options: UseScrollAnimationOptions = {}
) {
  const { threshold = 0.15, rootMargin = '0px 0px -10% 0px', triggerOnce = true } = options;
  const ref = useRef<T>(null);
  const [isVisible, setIsVisible] = useState(false);
  const hasTriggered = useRef(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // Respect reduced motion + skip observer entirely once triggered
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion || hasTriggered.current) {
      setIsVisible(true);
      return;
    }

    // SSR / older browser fallback
    if (typeof IntersectionObserver === 'undefined') {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (triggerOnce) {
            hasTriggered.current = true;
            observer.disconnect();
          }
        } else if (!triggerOnce) {
          setIsVisible(false);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [threshold, rootMargin, triggerOnce]);

  return { ref, isVisible };
}

// Hoisted out of component to avoid recreating per render
const ANIMATION_CLASSES = {
  'fade-up': {
    initial: 'opacity-0 translate-y-6',
    visible: 'opacity-100 translate-y-0',
  },
  'fade-in': {
    initial: 'opacity-0',
    visible: 'opacity-100',
  },
  'scale-in': {
    initial: 'opacity-0 scale-95',
    visible: 'opacity-100 scale-100',
  },
  'slide-left': {
    initial: 'opacity-0 translate-x-6',
    visible: 'opacity-100 translate-x-0',
  },
  'slide-right': {
    initial: 'opacity-0 -translate-x-6',
    visible: 'opacity-100 translate-x-0',
  },
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

  // Stable style object only changes when visibility flips
  const style = useMemo(
    () => ({
      transitionDuration: `${duration}ms`,
      transitionDelay: isVisible ? `${delay}ms` : '0ms',
      willChange: isVisible ? 'auto' : 'opacity, transform',
    }),
    [duration, delay, isVisible]
  );

  return (
    <div
      ref={ref}
      className={cn('transition-all ease-out motion-reduce:transition-none', isVisible ? visible : initial, className)}
      style={style}
    >
      {children}
    </div>
  );
}

export const ScrollAnimation = React.memo(ScrollAnimationImpl);
