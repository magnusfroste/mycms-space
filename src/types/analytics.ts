// ============================================
// Analytics Types
// ============================================

export interface PageView {
  id: string;
  page_slug: string;
  visitor_id: string;
  user_agent: string | null;
  referrer: string | null;
  created_at: string;
}

export interface ProjectView {
  id: string;
  project_id: string;
  visitor_id: string;
  action: string;
  created_at: string;
}

export interface ChatAnalytics {
  id: string;
  visitor_id: string;
  message_count: number;
  session_start: string;
  session_end: string | null;
  created_at: string;
}

export interface AnalyticsSummary {
  totalPageViews: number;
  uniqueVisitors: number;
  totalProjectViews: number;
  totalChatSessions: number;
  totalChatMessages: number;
  topPages: { page_slug: string; count: number }[];
  topProjects: { project_id: string; title: string; count: number }[];
  viewsByDay: { date: string; views: number }[];
}
