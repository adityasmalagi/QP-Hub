import { useEffect, useState } from 'react';

interface FloatingShape {
  id: number;
  type: 'circle' | 'hexagon' | 'square' | 'dot';
  size: number;
  x: number;
  y: number;
  delay: number;
  duration: number;
  opacity: number;
}

interface Particle {
  id: number;
  x: number;
  bottom: number;
  delay: number;
  duration: number;
  opacity: number;
}

export function FloatingElements() {
  const [shapes, setShapes] = useState<FloatingShape[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [lowMotion, setLowMotion] = useState(false);

  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    const low = reduceMotion || isMobile;
    setLowMotion(low);

    const shapeCount = low ? 6 : 15;
    const particleCount = low ? 8 : 20;

    // Generate random floating shapes (once)
    const generatedShapes: FloatingShape[] = Array.from({ length: shapeCount }, (_, i) => ({
      id: i,
      type: ['circle', 'hexagon', 'square', 'dot'][Math.floor(Math.random() * 4)] as FloatingShape['type'],
      size: Math.random() * (low ? 28 : 40) + (low ? 8 : 10),
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 5,
      duration: Math.random() * 4 + (low ? 5 : 4),
      opacity: Math.random() * 0.25 + 0.1,
    }));

    const generatedParticles: Particle[] = Array.from({ length: particleCount }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      bottom: Math.random() * 30,
      duration: 5 + Math.random() * 5,
      delay: Math.random() * 5,
      opacity: Math.random() * 0.25 + 0.1,
    }));

    setShapes(generatedShapes);
    setParticles(generatedParticles);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Gradient orbs (expensive on mobile when animated) */}
      <div
        className={`absolute w-[600px] h-[600px] -top-[200px] -left-[200px] rounded-full bg-primary/10 blur-3xl ${lowMotion ? '' : 'animate-blob'}`}
        style={{ animationDelay: '0s' }}
      />
      <div
        className={`absolute w-[500px] h-[500px] top-[50%] -right-[150px] rounded-full bg-accent/10 blur-3xl ${lowMotion ? '' : 'animate-blob'}`}
        style={{ animationDelay: '2s' }}
      />
      <div
        className={`absolute w-[400px] h-[400px] bottom-[10%] left-[30%] rounded-full bg-primary/5 blur-3xl ${lowMotion ? '' : 'animate-blob'}`}
        style={{ animationDelay: '4s' }}
      />

      {/* Floating geometric shapes */}
      {shapes.map((shape) => (
        <div
          key={shape.id}
          className="absolute"
          style={{
            left: `${shape.x}%`,
            top: `${shape.y}%`,
            animationDelay: `${shape.delay}s`,
            animationDuration: `${shape.duration}s`,
          }}
        >
          {shape.type === 'circle' && (
            <div
              className={`rounded-full border border-primary/30 ${lowMotion ? '' : 'animate-float-slow'}`}
              style={{
                width: shape.size,
                height: shape.size,
                opacity: shape.opacity,
              }}
            />
          )}
          {shape.type === 'hexagon' && (
            <svg
              width={shape.size}
              height={shape.size}
              viewBox="0 0 24 24"
              className={lowMotion ? '' : 'animate-float-medium'}
              style={{ opacity: shape.opacity }}
            >
              <polygon
                points="12,2 22,8.5 22,15.5 12,22 2,15.5 2,8.5"
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="1"
                strokeOpacity="0.3"
              />
            </svg>
          )}
          {shape.type === 'square' && (
            <div
              className={`border border-accent/20 rotate-45 ${lowMotion ? '' : 'animate-float-fast'}`}
              style={{
                width: shape.size * 0.7,
                height: shape.size * 0.7,
                opacity: shape.opacity,
              }}
            />
          )}
          {shape.type === 'dot' && (
            <div
              className={`rounded-full bg-primary/40 ${lowMotion ? '' : 'animate-float-medium'}`}
              style={{
                width: shape.size * 0.3,
                height: shape.size * 0.3,
                opacity: shape.opacity * 2,
              }}
            />
          )}
        </div>
      ))}

      {/* Particle dots floating upward */}
      <div className="absolute inset-0">
        {particles.map((p) => (
          <div
            key={`particle-${p.id}`}
            className="absolute w-1 h-1 rounded-full bg-primary/30"
            style={{
              left: `${p.x}%`,
              bottom: `${p.bottom}%`,
              opacity: p.opacity,
              animation: lowMotion ? undefined : `float-slow ${p.duration}s ease-in-out infinite`,
              animationDelay: `${p.delay}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

