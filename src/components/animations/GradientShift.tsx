const GradientShift = () => {
  return (
    <div 
      className="absolute inset-0 pointer-events-none animate-gradient-shift" 
      aria-hidden="true"
      style={{
        background: 'linear-gradient(45deg, hsl(var(--primary) / 0.1), hsl(var(--apple-blue) / 0.1), hsl(var(--apple-purple) / 0.1))',
        backgroundSize: '200% 200%',
      }}
    />
  );
};

export default GradientShift;
