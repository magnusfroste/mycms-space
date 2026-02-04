// ============================================
// Data Layer: Analytics
// Pure Supabase API calls - no UI logic
// ============================================

import { supabase } from '@/integrations/supabase/client';

// Generate or retrieve visitor ID
export const getVisitorId = (): string => {
  const key = 'visitor_id';
  let visitorId = localStorage.getItem(key);
  if (!visitorId) {
    visitorId = crypto.randomUUID();
    localStorage.setItem(key, visitorId);
  }
  return visitorId;
};

// Track page view
export const trackPageView = async (pageSlug: string): Promise<void> => {
  const visitorId = getVisitorId();
  
  await supabase.from('page_views').insert({
    page_slug: pageSlug,
    visitor_id: visitorId,
    user_agent: navigator.userAgent,
    referrer: document.referrer || null,
  });
};

// Track project view (table removed - no-op)
export const trackProjectView = async (
  _projectId: string,
  _action: 'view' | 'demo_click' = 'view'
): Promise<void> => {
  // Project views table has been removed - tracking disabled
};

// Track chat session
export const trackChatSession = async (): Promise<string> => {
  const visitorId = getVisitorId();
  
  const { data, error } = await supabase
    .from('chat_analytics')
    .insert({
      visitor_id: visitorId,
      message_count: 0,
    })
    .select('id')
    .single();

  if (error) throw error;
  return data.id;
};

// Update chat session message count
export const updateChatSession = async (
  sessionId: string,
  messageCount: number
): Promise<void> => {
  await supabase
    .from('chat_analytics')
    .update({
      message_count: messageCount,
      session_end: new Date().toISOString(),
    })
    .eq('id', sessionId);
};

// Fetch analytics summary
export const fetchAnalyticsSummary = async (days: number = 30) => {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const startDateStr = startDate.toISOString();

  // Fetch page views
  const { data: pageViews, error: pvError } = await supabase
    .from('page_views')
    .select('*')
    .gte('created_at', startDateStr);

  if (pvError) throw pvError;

  // Fetch chat analytics
  const { data: chatData, error: chatError } = await supabase
    .from('chat_analytics')
    .select('*')
    .gte('created_at', startDateStr);

  if (chatError) throw chatError;

  // Calculate metrics
  const uniqueVisitors = new Set(pageViews?.map((pv) => pv.visitor_id) || []).size;
  
  // Top pages (exclude project detail pages from main list)
  const pageCounts: Record<string, number> = {};
  const projectPageCounts: Record<string, number> = {};
  
  pageViews?.forEach((pv) => {
    // Check if it's a project detail page (e.g., "project/my-project-slug")
    if (pv.page_slug.startsWith('project/')) {
      const projectSlug = pv.page_slug.replace('project/', '');
      projectPageCounts[projectSlug] = (projectPageCounts[projectSlug] || 0) + 1;
    } else {
      pageCounts[pv.page_slug] = (pageCounts[pv.page_slug] || 0) + 1;
    }
  });
  
  const topPages = Object.entries(pageCounts)
    .map(([page_slug, count]) => ({ page_slug, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Top projects derived from page_views with "project/" prefix
  const topProjects = Object.entries(projectPageCounts)
    .map(([slug, count]) => ({ 
      project_id: slug, 
      title: slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()), // Convert slug to title
      count 
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
  
  const totalProjectViews = Object.values(projectPageCounts).reduce((sum, count) => sum + count, 0);

  // Views by day
  const viewsByDayMap: Record<string, number> = {};
  pageViews?.forEach((pv) => {
    const date = pv.created_at.split('T')[0];
    viewsByDayMap[date] = (viewsByDayMap[date] || 0) + 1;
  });
  const viewsByDay = Object.entries(viewsByDayMap)
    .map(([date, views]) => ({ date, views }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Chat metrics
  const totalChatMessages = chatData?.reduce((sum, c) => sum + (c.message_count || 0), 0) || 0;

  return {
    totalPageViews: pageViews?.length || 0,
    uniqueVisitors,
    totalProjectViews,
    totalChatSessions: chatData?.length || 0,
    totalChatMessages,
    topPages,
    topProjects,
    viewsByDay,
  };
};
