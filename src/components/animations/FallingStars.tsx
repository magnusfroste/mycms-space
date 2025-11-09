const FallingStars = () => {
  // Generate 18 stars with random properties
  const stars = Array.from({ length: 18 }, (_, i) => ({
    id: i,
    size: Math.random() * 3 + 1, // 1-4px
    duration: Math.random() * 5 + 4, // 4-9s
    delay: Math.random() * 8, // 0-8s delay
    left: Math.random() * 100, // 0-100%
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {stars.map((star) => (
        <div
          key={star.id}
          className="absolute rounded-full bg-primary/40 animate-falling-star"
          style={{
            width: `${star.size}px`,
            height: `${star.size}px`,
            left: `${star.left}%`,
            animationDuration: `${star.duration}s`,
            animationDelay: `${star.delay}s`,
            boxShadow: '0 0 6px 2px hsl(var(--primary) / 0.3)',
          }}
        />
      ))}
    </div>
  );
};

export default FallingStars;
