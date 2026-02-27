// ============================================
// Chat Artifact Component
// Renders rich structured content (CV match, documents)
// ============================================

import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MarkdownContent } from "@/components/common";
import { Copy, Check, Target, FileText, Mail } from "lucide-react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
} from "recharts";
import type { ChatArtifact as ChatArtifactType } from "./types";

interface ChatArtifactProps {
  artifact: ChatArtifactType;
}

const CopyButton: React.FC<{ text: string }> = ({ text }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleCopy}
      className="h-7 gap-1 text-xs text-muted-foreground hover:text-foreground"
    >
      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
      {copied ? "Copied" : "Copy"}
    </Button>
  );
};

const CvMatchArtifact: React.FC<{ data: Record<string, unknown> }> = ({ data }) => {
  const overallScore = (data.overall_score as number) || 0;
  const summary = (data.summary as string) || "";
  const matchAnalysis = (data.match_analysis as Array<{
    skill: string;
    required_level: number;
    magnus_level: number;
    category: string;
  }>) || [];
  const tailoredCv = (data.tailored_cv as string) || "";
  const coverLetter = (data.cover_letter as string) || "";

  // Prepare radar chart data
  const radarData = matchAnalysis.slice(0, 8).map((item) => ({
    skill: item.skill.length > 15 ? item.skill.slice(0, 15) + "…" : item.skill,
    required: item.required_level,
    magnus: item.magnus_level,
  }));

  return (
    <div className="mt-3 rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      {/* Score Header */}
      <div className="px-5 py-4 bg-gradient-to-r from-primary/5 to-accent/5 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative h-14 w-14 flex items-center justify-center">
              <svg className="h-14 w-14 -rotate-90" viewBox="0 0 56 56">
                <circle cx="28" cy="28" r="24" fill="none" stroke="hsl(var(--muted))" strokeWidth="4" />
                <circle
                  cx="28" cy="28" r="24" fill="none"
                  stroke="hsl(var(--primary))" strokeWidth="4"
                  strokeDasharray={`${(overallScore / 100) * 150.8} 150.8`}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute text-sm font-bold text-foreground">{overallScore}%</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Match Score</p>
              <p className="text-xs text-muted-foreground">{summary}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="analysis" className="w-full">
        <TabsList className="w-full justify-start rounded-none border-b border-border bg-transparent px-4 h-10">
          <TabsTrigger value="analysis" className="gap-1.5 text-xs data-[state=active]:shadow-none">
            <Target className="h-3.5 w-3.5" />
            Match
          </TabsTrigger>
          <TabsTrigger value="cv" className="gap-1.5 text-xs data-[state=active]:shadow-none">
            <FileText className="h-3.5 w-3.5" />
            CV
          </TabsTrigger>
          <TabsTrigger value="letter" className="gap-1.5 text-xs data-[state=active]:shadow-none">
            <Mail className="h-3.5 w-3.5" />
            Cover Letter
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analysis" className="px-5 py-4 mt-0">
          {radarData.length > 0 ? (
            <div className="space-y-4">
              <ResponsiveContainer width="100%" height={250}>
                <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="75%">
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis dataKey="skill" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9 }} />
                  <Radar name="Required" dataKey="required" stroke="hsl(var(--muted-foreground))" fill="hsl(var(--muted))" fillOpacity={0.3} />
                  <Radar name="Magnus" dataKey="magnus" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
                </RadarChart>
              </ResponsiveContainer>
              <div className="flex gap-4 justify-center text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-muted-foreground" /> Required
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-primary" /> Magnus
                </span>
              </div>
              {/* Skill list */}
              <div className="space-y-1.5">
                {matchAnalysis.map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span className="text-foreground">{item.skill}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                        {item.category}
                      </Badge>
                      <span className={item.magnus_level >= item.required_level ? "text-green-600" : "text-amber-500"}>
                        {item.magnus_level}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No detailed analysis available.</p>
          )}
        </TabsContent>

        <TabsContent value="cv" className="px-5 py-4 mt-0">
          <div className="flex justify-end mb-2">
            <CopyButton text={tailoredCv} />
          </div>
          {tailoredCv ? (
            <MarkdownContent content={tailoredCv} compact className="text-left" />
          ) : (
            <p className="text-sm text-muted-foreground">No tailored CV generated.</p>
          )}
        </TabsContent>

        <TabsContent value="letter" className="px-5 py-4 mt-0">
          <div className="flex justify-end mb-2">
            <CopyButton text={coverLetter} />
          </div>
          {coverLetter ? (
            <MarkdownContent content={coverLetter} compact className="text-left" />
          ) : (
            <p className="text-sm text-muted-foreground">No cover letter generated.</p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

const ChatArtifact: React.FC<ChatArtifactProps> = ({ artifact }) => {
  switch (artifact.type) {
    case "cv-match":
      return <CvMatchArtifact data={artifact.data} />;
    case "document":
      return (
        <div className="mt-3 rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-foreground">{artifact.title}</h4>
            <CopyButton text={(artifact.data.content as string) || ""} />
          </div>
          <MarkdownContent content={(artifact.data.content as string) || ""} compact className="text-left" />
        </div>
      );
    default:
      return null;
  }
};

export default ChatArtifact;
