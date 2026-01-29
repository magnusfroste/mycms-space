// ============================================
// Testimonial Carousel Block
// Modern 3D carousel with testimonials
// ============================================

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, Quote } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Testimonial {
  id: string;
  quote: string;
  author: string;
  role: string;
  company?: string;
  avatar_url?: string;
  rating?: number;
}

interface TestimonialCarouselBlockConfig {
  headline?: string;
  subheadline?: string;
  testimonials?: Testimonial[];
  autoplay?: boolean;
  autoplay_interval?: number;
}

interface TestimonialCarouselBlockProps {
  config: Record<string, unknown>;
}

const defaultTestimonials: Testimonial[] = [
  {
    id: '1',
    quote: 'Working with this team transformed our digital presence completely. The attention to detail and innovative approach exceeded all expectations.',
    author: 'Sarah Chen',
    role: 'CEO',
    company: 'TechVentures',
    rating: 5,
  },
  {
    id: '2',
    quote: 'The creativity and technical expertise delivered was outstanding. Our conversion rates increased by 340% within the first quarter.',
    author: 'Marcus Johnson',
    role: 'Marketing Director',
    company: 'GrowthLabs',
    rating: 5,
  },
  {
    id: '3',
    quote: 'A truly exceptional experience from start to finish. They understood our vision and brought it to life in ways we never imagined.',
    author: 'Elena Rodriguez',
    role: 'Founder',
    company: 'Artisan Studio',
    rating: 5,
  },
  {
    id: '4',
    quote: 'Professional, responsive, and incredibly talented. The project was delivered ahead of schedule with impeccable quality.',
    author: 'David Kim',
    role: 'CTO',
    company: 'InnovateCorp',
    rating: 5,
  },
];

const TestimonialCarouselBlock: React.FC<TestimonialCarouselBlockProps> = ({ config }) => {
  const settings = config as TestimonialCarouselBlockConfig;
  const testimonials = settings.testimonials || defaultTestimonials;
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (settings.autoplay !== false) {
      const interval = setInterval(() => {
        goToNext();
      }, settings.autoplay_interval || 5000);
      return () => clearInterval(interval);
    }
  }, [activeIndex, settings.autoplay, settings.autoplay_interval]);

  const goToNext = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setActiveIndex((prev) => (prev + 1) % testimonials.length);
    setTimeout(() => setIsAnimating(false), 500);
  };

  const goToPrev = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setActiveIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
    setTimeout(() => setIsAnimating(false), 500);
  };

  const getCardStyle = (index: number) => {
    const diff = index - activeIndex;
    const normalizedDiff = ((diff + testimonials.length) % testimonials.length);
    const adjustedDiff = normalizedDiff > testimonials.length / 2 
      ? normalizedDiff - testimonials.length 
      : normalizedDiff;

    const absPosition = Math.abs(adjustedDiff);
    const isActive = index === activeIndex;

    return {
      transform: `
        translateX(${adjustedDiff * 60}%) 
        scale(${1 - absPosition * 0.15}) 
        rotateY(${adjustedDiff * -5}deg)
      `,
      zIndex: 10 - absPosition,
      opacity: absPosition > 2 ? 0 : 1 - absPosition * 0.3,
      filter: isActive ? 'none' : `blur(${absPosition * 2}px)`,
    };
  };

  return (
    <section className="py-24 px-6 overflow-hidden">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
            {settings.headline || 'What People Say'}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {settings.subheadline || 'Trusted by industry leaders and innovators worldwide.'}
          </p>
        </div>

        {/* Carousel */}
        <div className="relative h-[400px] md:h-[450px] perspective-[1000px]">
          {/* Cards */}
          <div className="absolute inset-0 flex items-center justify-center">
            {testimonials.map((testimonial, index) => (
              <div
                key={testimonial.id}
                className={cn(
                  'absolute w-full max-w-xl transition-all duration-500 ease-out',
                  'cursor-pointer'
                )}
                style={getCardStyle(index)}
                onClick={() => !isAnimating && setActiveIndex(index)}
              >
                <div className={cn(
                  'p-8 md:p-10 rounded-3xl',
                  'bg-gradient-to-br from-card to-card/80',
                  'border border-border/50',
                  'shadow-2xl shadow-black/5',
                  index === activeIndex && 'border-primary/30'
                )}>
                  {/* Quote Icon */}
                  <Quote className="w-10 h-10 text-primary/30 mb-4" />

                  {/* Quote Text */}
                  <blockquote className="text-lg md:text-xl leading-relaxed mb-6">
                    "{testimonial.quote}"
                  </blockquote>

                  {/* Author */}
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center text-lg font-semibold text-primary">
                      {testimonial.avatar_url ? (
                        <img 
                          src={testimonial.avatar_url} 
                          alt={testimonial.author}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        testimonial.author.charAt(0)
                      )}
                    </div>

                    {/* Author Info */}
                    <div>
                      <div className="font-semibold">{testimonial.author}</div>
                      <div className="text-sm text-muted-foreground">
                        {testimonial.role}
                        {testimonial.company && ` at ${testimonial.company}`}
                      </div>
                    </div>

                    {/* Rating */}
                    {testimonial.rating && (
                      <div className="ml-auto flex gap-1">
                        {[...Array(5)].map((_, i) => (
                          <svg
                            key={i}
                            className={cn(
                              'w-4 h-4',
                              i < testimonial.rating! ? 'text-yellow-500' : 'text-muted'
                            )}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Navigation */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              className="rounded-full"
              onClick={goToPrev}
              disabled={isAnimating}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>

            {/* Dots */}
            <div className="flex gap-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  className={cn(
                    'w-2 h-2 rounded-full transition-all duration-300',
                    index === activeIndex 
                      ? 'w-8 bg-primary' 
                      : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                  )}
                  onClick={() => !isAnimating && setActiveIndex(index)}
                />
              ))}
            </div>

            <Button
              variant="outline"
              size="icon"
              className="rounded-full"
              onClick={goToNext}
              disabled={isAnimating}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialCarouselBlock;
