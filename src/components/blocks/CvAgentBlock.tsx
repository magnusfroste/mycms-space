// ============================================
// CV Agent Block
// Premium CTA block for recruiter JD analysis
// Funnels into /chat with JD pre-filled
// ============================================

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

interface CvAgentBlockConfig {
  title?: string;
  subtitle?: string;
  badge_text?: string;
  button_text?: string;
  placeholder?: string;
  features?: string[];
}

interface CvAgentBlockProps {
  config: unknown;
}

const CvAgentBlock: React.FC<CvAgentBlockProps> = ({ config }) => {
  const c = (config || {}) as CvAgentBlockConfig;
  const navigate = useNavigate();
  const [jobDescription, setJobDescription] = useState("");

  const title = c.title || "Is Magnus the Right Fit for Your Gig?";
  const subtitle = c.subtitle || "Paste a job description and let Magnet analyze the match, generate a tailored CV, and write a cover letter — in seconds.";
  const badgeText = c.badge_text || "AI-Powered";
  const buttonText = c.button_text || "Analyze Match";
  const placeholder = c.placeholder || "Paste the job description here...";
  const features = c.features || ["Skill Match", "Tailored CV", "Cover Letter"];

  const handleSubmit = () => {
    if (!jobDescription.trim()) return;
    navigate("/chat", {
      state: {
        messages: [
          {
            id: Date.now().toString(),
            text: jobDescription.trim(),
            isUser: true,
            source: 'cv-agent' as const,
          },
        ],
      },
    });
  };

  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="relative max-w-3xl mx-auto rounded-2xl overflow-hidden">
          {/* Gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-[hsl(var(--gradient-mid))] to-accent opacity-90" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.12),transparent_50%)]" />

          {/* Content */}
          <div className="relative z-10 px-6 py-12 md:px-12 md:py-16 text-center">
            {/* Badge */}
            <Badge className="mb-6 bg-white/20 text-white border-white/30 hover:bg-white/30 gap-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              {badgeText}
            </Badge>

            {/* Title */}
            <h2 className="text-2xl md:text-4xl font-bold text-white mb-3 tracking-tight">
              {title}
            </h2>

            {/* Subtitle */}
            <p className="text-white/80 text-sm md:text-base max-w-lg mx-auto mb-8 leading-relaxed">
              {subtitle}
            </p>

            {/* Textarea */}
            <div className="max-w-xl mx-auto mb-6">
              <Textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder={placeholder}
                rows={5}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus-visible:ring-white/30 resize-none backdrop-blur-sm"
              />
            </div>

            {/* Button */}
            <Button
              size="lg"
              onClick={handleSubmit}
              disabled={!jobDescription.trim()}
              className="bg-white text-primary hover:bg-white/90 font-semibold gap-2 px-8 disabled:opacity-40"
            >
              {buttonText}
              <ArrowRight className="h-4 w-4" />
            </Button>

            {/* Feature pills */}
            <div className="flex flex-wrap justify-center gap-2 mt-8">
              {features.map((feature, i) => (
                <span
                  key={i}
                  className="px-3 py-1 rounded-full text-xs font-medium bg-white/15 text-white/90 border border-white/20"
                >
                  {feature}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CvAgentBlock;
