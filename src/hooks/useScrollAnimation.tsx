import { useEffect, useRef, useState } from 'react';

interface UseScrollAnimationOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
}

export function useScrollAnimation<T extends HTMLElement = HTMLDivElement>(
  options: UseScrollAnimationOptions = {}
) {
  const { threshold = 0.1, rootMargin = '0px', triggerOnce = true } = options;
  const ref = useRef<T>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (triggerOnce) {
            observer.unobserve(element);
          }
        } else if (!triggerOnce) {
          setIsVisible(false);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [threshold, rootMargin, triggerOnce]);

  return { ref, isVisible };
}

// Animation wrapper component for easier usage
import React from 'react';
import { cn } from '@/lib/utils';

interface ScrollAnimationProps {
  children: React.ReactNode;
  className?: string;
  animation?: 'fade-up' | 'fade-in' | 'scale-in' | 'slide-left' | 'slide-right';
  delay?: number;
  duration?: number;
  threshold?: number;
  triggerOnce?: boolean;
}

export function ScrollAnimation({
  children,
  className,
  animation = 'fade-up',
  delay = 0,
  duration = 500,
  threshold = 0.1,
  triggerOnce = true,
}: ScrollAnimationProps) {
  const { ref, isVisible } = useScrollAnimation<HTMLDivElement>({ threshold, triggerOnce });

  const animationClasses = {
    'fade-up': {
      initial: 'opacity-0 translate-y-8',
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
      initial: 'opacity-0 translate-x-8',
      visible: 'opacity-100 translate-x-0',
    },
    'slide-right': {
      initial: 'opacity-0 -translate-x-8',
      visible: 'opacity-100 translate-x-0',
    },
  };

  const { initial, visible } = animationClasses[animation];

  return (
    <div
      ref={ref}
      className={cn(
        'transition-all ease-out',
        isVisible ? visible : initial,
        className
      )}
      style={{
        transitionDuration: `${duration}ms`,
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}
