import { useMemo } from 'react';

const ParticleField = () => {
  // Memoize particles to prevent regeneration on each render
  const particles = useMemo(() => 
    Array.from({ length: 25 }, (_, i) => ({
      id: i,
      size: Math.random() * 4 + 2, // 2-6px
      duration: Math.random() * 8 + 6, // 6-14s
      delay: Math.random() * 5, // 0-5s delay
      left: Math.random() * 100, // 0-100%
      top: Math.random() * 100, // 0-100%
      opacity: Math.random() * 0.3 + 0.1, // 0.1-0.4
    })), 
  []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute rounded-full bg-primary animate-float-particle"
          style={{
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            left: `${particle.left}%`,
            top: `${particle.top}%`,
            opacity: particle.opacity,
            animationDuration: `${particle.duration}s`,
            animationDelay: `${particle.delay}s`,
            filter: 'blur(1px)',
          }}
        />
      ))}
    </div>
  );
};

export default ParticleField;
