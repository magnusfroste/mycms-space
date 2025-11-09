import React from 'react';
import { 
  Rocket, BarChart, Brain, Lightbulb, Building, 
  LineChart, Layers, Users, Code, Zap, Target 
} from "lucide-react";

// Centralized icon mapping - single source of truth
export const iconMap: Record<string, React.ReactNode> = {
  Rocket: <Rocket className="text-apple-purple h-5 w-5" />,
  BarChart: <BarChart className="text-apple-blue h-5 w-5" />,
  Brain: <Brain className="text-apple-purple h-5 w-5" />,
  Lightbulb: <Lightbulb className="text-apple-purple h-5 w-5" />,
  Building: <Building className="text-apple-blue h-5 w-5" />,
  LineChart: <LineChart className="text-apple-purple h-5 w-5" />,
  Layers: <Layers className="text-apple-blue h-5 w-5" />,
  Users: <Users className="text-apple-purple h-5 w-5" />,
  Code: <Code className="text-apple-purple h-5 w-5" />,
  Zap: <Zap className="text-apple-blue h-5 w-5" />,
  Target: <Target className="text-apple-purple h-5 w-5" />,
};
