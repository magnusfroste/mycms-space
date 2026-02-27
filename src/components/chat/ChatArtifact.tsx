// ============================================
// Chat Artifact Component
// Renders rich structured content (CV match, portfolio, project, availability)
// ============================================

import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MarkdownContent } from "@/components/common";
import { Copy, Check, Target, FileText, Mail, FolderOpen, Code, Zap, Calendar, CheckCircle, XCircle, Clock } from "lucide-react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
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

// ---- CV Match Artifact ----
const CvMatchArtifact: React.FC<{ data: Record<string, unknown> }> = ({ data }) => {
  const overallScore = (data.overall_score as number) || 0;
  const summary = (data.summary as string) || "";
  const matchAnalysis = (data.match_analysis as Array<{
    skill: string; required_level: number; magnus_level: number; category: string;
  }>) || [];
  const tailoredCv = (data.tailored_cv as string) || "";
  const coverLetter = (data.cover_letter as string) || "";

  const radarData = matchAnalysis.slice(0, 8).map((item) => ({
    skill: item.skill.length > 15 ? item.skill.slice(0, 15) + "…" : item.skill,
    required: item.required_level,
    magnus: item.magnus_level,
  }));

  return (
    <div className="mt-3 rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <div className="px-5 py-4 bg-gradient-to-r from-primary/5 to-accent/5 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="relative h-14 w-14 flex items-center justify-center">
            <svg className="h-14 w-14 -rotate-90" viewBox="0 0 56 56">
              <circle cx="28" cy="28" r="24" fill="none" stroke="hsl(var(--muted))" strokeWidth="4" />
              <circle cx="28" cy="28" r="24" fill="none" stroke="hsl(var(--primary))" strokeWidth="4"
                strokeDasharray={`${(overallScore / 100) * 150.8} 150.8`} strokeLinecap="round" />
            </svg>
            <span className="absolute text-sm font-bold text-foreground">{overallScore}%</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Match Score</p>
            <p className="text-xs text-muted-foreground">{summary}</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="analysis" className="w-full">
        <TabsList className="w-full justify-start rounded-none border-b border-border bg-transparent px-4 h-10">
          <TabsTrigger value="analysis" className="gap-1.5 text-xs"><Target className="h-3.5 w-3.5" />Match</TabsTrigger>
          <TabsTrigger value="cv" className="gap-1.5 text-xs"><FileText className="h-3.5 w-3.5" />CV</TabsTrigger>
          <TabsTrigger value="letter" className="gap-1.5 text-xs"><Mail className="h-3.5 w-3.5" />Cover Letter</TabsTrigger>
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
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-muted-foreground" /> Required</span>
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-primary" /> Magnus</span>
              </div>
              <div className="space-y-1.5">
                {matchAnalysis.map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span className="text-foreground">{item.skill}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">{item.category}</Badge>
                      <span className={item.magnus_level >= item.required_level ? "text-green-600" : "text-amber-500"}>{item.magnus_level}%</span>
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
          <div className="flex justify-end mb-2"><CopyButton text={tailoredCv} /></div>
          {tailoredCv ? <MarkdownContent content={tailoredCv} compact className="text-left" /> : <p className="text-sm text-muted-foreground">No tailored CV generated.</p>}
        </TabsContent>

        <TabsContent value="letter" className="px-5 py-4 mt-0">
          <div className="flex justify-end mb-2"><CopyButton text={coverLetter} /></div>
          {coverLetter ? <MarkdownContent content={coverLetter} compact className="text-left" /> : <p className="text-sm text-muted-foreground">No cover letter generated.</p>}
        </TabsContent>
      </Tabs>
    </div>
  );
};

// ---- Portfolio Artifact ----
const PortfolioArtifact: React.FC<{ data: Record<string, unknown> }> = ({ data }) => {
  const title = (data.title as string) || "Portfolio";
  const summary = (data.summary as string) || "";
  const projects = (data.projects as Array<{
    name: string; description: string; tech_stack: string[]; highlights: string[]; url?: string;
  }>) || [];
  const skillsHighlight = (data.skills_highlight as Array<{ skill: string; proficiency: number }>) || [];

  const chartData = skillsHighlight.slice(0, 8).map(s => ({ name: s.skill.length > 12 ? s.skill.slice(0, 12) + "…" : s.skill, value: s.proficiency }));

  return (
    <div className="mt-3 rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <div className="px-5 py-4 bg-gradient-to-r from-primary/5 to-accent/5 border-b border-border">
        <div className="flex items-center gap-2">
          <FolderOpen className="h-5 w-5 text-primary" />
          <div>
            <p className="text-sm font-semibold text-foreground">{title}</p>
            <p className="text-xs text-muted-foreground">{summary}</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="projects" className="w-full">
        <TabsList className="w-full justify-start rounded-none border-b border-border bg-transparent px-4 h-10">
          <TabsTrigger value="projects" className="gap-1.5 text-xs"><Code className="h-3.5 w-3.5" />Projects</TabsTrigger>
          <TabsTrigger value="skills" className="gap-1.5 text-xs"><Zap className="h-3.5 w-3.5" />Skills</TabsTrigger>
        </TabsList>

        <TabsContent value="projects" className="px-5 py-4 mt-0 space-y-4">
          {projects.map((p, i) => (
            <div key={i} className="rounded-lg border border-border p-4 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-foreground">{p.name}</h4>
                {p.url && <a href={p.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">View →</a>}
              </div>
              <p className="text-xs text-muted-foreground">{p.description}</p>
              <div className="flex flex-wrap gap-1">
                {p.tech_stack.map((t, j) => <Badge key={j} variant="secondary" className="text-[10px]">{t}</Badge>)}
              </div>
              <ul className="space-y-0.5">
                {p.highlights.map((h, j) => <li key={j} className="text-xs text-foreground flex items-start gap-1.5"><Check className="h-3 w-3 text-primary mt-0.5 shrink-0" />{h}</li>)}
              </ul>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="skills" className="px-5 py-4 mt-0">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} layout="vertical" margin={{ left: 0, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={90} />
                <Tooltip />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground">No skill data available.</p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

// ---- Project Deep Dive Artifact ----
const ProjectDeepDiveArtifact: React.FC<{ data: Record<string, unknown> }> = ({ data }) => {
  const projectName = (data.project_name as string) || "Project";
  const tagline = (data.tagline as string) || "";
  const problem = (data.problem as string) || "";
  const solution = (data.solution as string) || "";
  const techStack = (data.tech_stack as Array<{ name: string; role: string }>) || [];
  const keyFeatures = (data.key_features as string[]) || [];
  const learnings = (data.learnings as string) || "";
  const url = (data.url as string) || "";

  return (
    <div className="mt-3 rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <div className="px-5 py-4 bg-gradient-to-r from-primary/5 to-accent/5 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-foreground">{projectName}</p>
            <p className="text-xs text-muted-foreground">{tagline}</p>
          </div>
          {url && <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">View →</a>}
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="w-full justify-start rounded-none border-b border-border bg-transparent px-4 h-10">
          <TabsTrigger value="overview" className="gap-1.5 text-xs"><Target className="h-3.5 w-3.5" />Overview</TabsTrigger>
          <TabsTrigger value="tech" className="gap-1.5 text-xs"><Code className="h-3.5 w-3.5" />Tech</TabsTrigger>
          {learnings && <TabsTrigger value="learnings" className="gap-1.5 text-xs"><Zap className="h-3.5 w-3.5" />Learnings</TabsTrigger>}
        </TabsList>

        <TabsContent value="overview" className="px-5 py-4 mt-0 space-y-4">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Problem</p>
            <p className="text-sm text-foreground">{problem}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Solution</p>
            <MarkdownContent content={solution} compact className="text-left" />
          </div>
          {keyFeatures.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Key Features</p>
              <ul className="space-y-1">
                {keyFeatures.map((f, i) => <li key={i} className="text-xs text-foreground flex items-start gap-1.5"><Check className="h-3 w-3 text-primary mt-0.5 shrink-0" />{f}</li>)}
              </ul>
            </div>
          )}
        </TabsContent>

        <TabsContent value="tech" className="px-5 py-4 mt-0">
          <div className="space-y-2">
            {techStack.map((t, i) => (
              <div key={i} className="flex items-start gap-3 text-xs">
                <Badge variant="outline" className="shrink-0">{t.name}</Badge>
                <span className="text-muted-foreground">{t.role}</span>
              </div>
            ))}
          </div>
        </TabsContent>

        {learnings && (
          <TabsContent value="learnings" className="px-5 py-4 mt-0">
            <MarkdownContent content={learnings} compact className="text-left" />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

// ---- Availability Artifact ----
const AvailabilityArtifact: React.FC<{ data: Record<string, unknown> }> = ({ data }) => {
  const status = (data.status as string) || "available";
  const summary = (data.summary as string) || "";
  const engagementTypes = (data.engagement_types as Array<{ type: string; available: boolean; details: string }>) || [];
  const preferredContact = (data.preferred_contact as string) || "";
  const nextSteps = (data.next_steps as string) || "";

  const statusConfig = {
    available: { icon: CheckCircle, color: "text-green-600", bg: "bg-green-500/10", label: "Available" },
    limited: { icon: Clock, color: "text-amber-500", bg: "bg-amber-500/10", label: "Limited" },
    unavailable: { icon: XCircle, color: "text-red-500", bg: "bg-red-500/10", label: "Unavailable" },
  }[status] || { icon: Clock, color: "text-muted-foreground", bg: "bg-muted", label: status };

  const StatusIcon = statusConfig.icon;

  return (
    <div className="mt-3 rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <div className={`px-5 py-4 ${statusConfig.bg} border-b border-border`}>
        <div className="flex items-center gap-3">
          <StatusIcon className={`h-6 w-6 ${statusConfig.color}`} />
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-foreground">{statusConfig.label}</p>
              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground">{summary}</p>
          </div>
        </div>
      </div>

      <div className="px-5 py-4 space-y-4">
        <div className="space-y-2">
          {engagementTypes.map((e, i) => (
            <div key={i} className="flex items-start gap-3 text-xs">
              {e.available
                ? <CheckCircle className="h-3.5 w-3.5 text-green-600 mt-0.5 shrink-0" />
                : <XCircle className="h-3.5 w-3.5 text-red-400 mt-0.5 shrink-0" />}
              <div>
                <span className="font-medium text-foreground">{e.type}</span>
                <p className="text-muted-foreground">{e.details}</p>
              </div>
            </div>
          ))}
        </div>

        {preferredContact && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Contact</p>
            <p className="text-xs text-foreground">{preferredContact}</p>
          </div>
        )}

        {nextSteps && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Next Steps</p>
            <MarkdownContent content={nextSteps} compact className="text-left" />
          </div>
        )}
      </div>
    </div>
  );
};

// ---- Main Artifact Router ----
const ChatArtifact: React.FC<ChatArtifactProps> = ({ artifact }) => {
  switch (artifact.type) {
    case "cv-match":
      return <CvMatchArtifact data={artifact.data} />;
    case "portfolio":
      return <PortfolioArtifact data={artifact.data} />;
    case "project-deep-dive":
      return <ProjectDeepDiveArtifact data={artifact.data} />;
    case "availability":
      return <AvailabilityArtifact data={artifact.data} />;
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
