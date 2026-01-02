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

export function FloatingElements() {
  const [shapes, setShapes] = useState<FloatingShape[]>([]);

  useEffect(() => {
    // Generate random floating shapes
    const generatedShapes: FloatingShape[] = Array.from({ length: 15 }, (_, i) => ({
      id: i,
      type: ['circle', 'hexagon', 'square', 'dot'][Math.floor(Math.random() * 4)] as FloatingShape['type'],
      size: Math.random() * 40 + 10,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 5,
      duration: Math.random() * 4 + 4,
      opacity: Math.random() * 0.3 + 0.1,
    }));
    setShapes(generatedShapes);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Animated gradient orbs */}
      <div 
        className="absolute w-[600px] h-[600px] -top-[200px] -left-[200px] rounded-full bg-primary/10 blur-3xl animate-blob"
        style={{ animationDelay: '0s' }}
      />
      <div 
        className="absolute w-[500px] h-[500px] top-[50%] -right-[150px] rounded-full bg-accent/10 blur-3xl animate-blob"
        style={{ animationDelay: '2s' }}
      />
      <div 
        className="absolute w-[400px] h-[400px] bottom-[10%] left-[30%] rounded-full bg-primary/5 blur-3xl animate-blob"
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
              className="rounded-full border border-primary/30 animate-float-slow"
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
              className="animate-float-medium"
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
              className="border border-accent/20 rotate-45 animate-float-fast"
              style={{ 
                width: shape.size * 0.7, 
                height: shape.size * 0.7,
                opacity: shape.opacity,
              }}
            />
          )}
          {shape.type === 'dot' && (
            <div 
              className="rounded-full bg-primary/40 animate-float-medium"
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
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={`particle-${i}`}
            className="absolute w-1 h-1 rounded-full bg-primary/30"
            style={{
              left: `${Math.random() * 100}%`,
              bottom: `${Math.random() * 30}%`,
              animation: `float-slow ${5 + Math.random() * 5}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 5}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
