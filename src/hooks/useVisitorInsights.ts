// ============================================
// Hook: Visitor Insights
// Tracks visitor behavior via localStorage cookies
// Provides context for personalized AI interactions
// ============================================

import { useEffect, useState, useCallback } from 'react';
import { useLocation } from 'react-router-dom';

const STORAGE_KEY = 'magnet_visitor';

export interface VisitorInsights {
  visitCount: number;
  firstVisit: string;
  lastVisit: string;
  currentVisit: string;
  pagesVisited: string[];
  currentSession: string[];
  isReturning: boolean;
  daysSinceLastVisit: number | null;
  topPages: string[];
  referrer: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
}

interface StoredVisitorData {
  visitCount: number;
  firstVisit: string;
  lastVisit: string;
  sessionId: string;
  pagesVisited: Record<string, number>; // page → visit count
  currentSession: string[];
  referrer: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
}

const generateSessionId = () => `s_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const getStoredData = (): StoredVisitorData | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const saveData = (data: StoredVisitorData) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Storage full or blocked
  }
};

export const useVisitorInsights = (): VisitorInsights => {
  const location = useLocation();
  const [insights, setInsights] = useState<VisitorInsights>(() => buildInsights(null));

  useEffect(() => {
    const now = new Date().toISOString();
    const existing = getStoredData();
    const currentPath = location.pathname === '/' ? 'home' : location.pathname.slice(1);

    // Skip admin pages
    if (location.pathname.startsWith('/admin')) return;

    // Capture referrer & UTM on first page load
    const params = new URLSearchParams(window.location.search);
    const referrer = document.referrer && !document.referrer.includes(window.location.hostname)
      ? document.referrer : null;
    const utmSource = params.get('utm_source');
    const utmMedium = params.get('utm_medium');
    const utmCampaign = params.get('utm_campaign');

    if (!existing) {
      // First-time visitor
      const data: StoredVisitorData = {
        visitCount: 1,
        firstVisit: now,
        lastVisit: now,
        sessionId: generateSessionId(),
        pagesVisited: { [currentPath]: 1 },
        currentSession: [currentPath],
        referrer,
        utmSource,
        utmMedium,
        utmCampaign,
      };
      saveData(data);
      setInsights(buildInsights(data));
    } else {
      // Check if new session (30 min gap)
      const lastActivity = new Date(existing.lastVisit).getTime();
      const isNewSession = Date.now() - lastActivity > 30 * 60 * 1000;

      const updated: StoredVisitorData = {
        ...existing,
        lastVisit: now,
        visitCount: isNewSession ? existing.visitCount + 1 : existing.visitCount,
        sessionId: isNewSession ? generateSessionId() : existing.sessionId,
        pagesVisited: {
          ...existing.pagesVisited,
          [currentPath]: (existing.pagesVisited[currentPath] || 0) + 1,
        },
        currentSession: isNewSession
          ? [currentPath]
          : existing.currentSession.includes(currentPath)
            ? existing.currentSession
            : [...existing.currentSession, currentPath],
        // Update referrer/UTM if new session brings fresh data
        referrer: (isNewSession && referrer) ? referrer : existing.referrer,
        utmSource: (isNewSession && utmSource) ? utmSource : existing.utmSource,
        utmMedium: (isNewSession && utmMedium) ? utmMedium : existing.utmMedium,
        utmCampaign: (isNewSession && utmCampaign) ? utmCampaign : existing.utmCampaign,
      };

      saveData(updated);
      setInsights(buildInsights(updated));
    }
  }, [location.pathname]);

  return insights;
};

function buildInsights(data: StoredVisitorData | null): VisitorInsights {
  if (!data) {
    return {
      visitCount: 1,
      firstVisit: new Date().toISOString(),
      lastVisit: new Date().toISOString(),
      currentVisit: new Date().toISOString(),
      pagesVisited: [],
      currentSession: [],
      isReturning: false,
      daysSinceLastVisit: null,
      topPages: [],
      referrer: null,
      utmSource: null,
      utmMedium: null,
      utmCampaign: null,
    };
  }

  const allPages = Object.keys(data.pagesVisited);
  const topPages = Object.entries(data.pagesVisited)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([page]) => page);

  const daysSinceLastVisit = data.visitCount > 1
    ? Math.floor((Date.now() - new Date(data.lastVisit).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return {
    visitCount: data.visitCount,
    firstVisit: data.firstVisit,
    lastVisit: data.lastVisit,
    currentVisit: new Date().toISOString(),
    pagesVisited: allPages,
    currentSession: data.currentSession,
    isReturning: data.visitCount > 1,
    daysSinceLastVisit,
    topPages,
  };
}

/** Format visitor insights for AI context injection */
export function formatVisitorInsightsForAI(insights: VisitorInsights): Record<string, unknown> {
  return {
    visitCount: insights.visitCount,
    isReturning: insights.isReturning,
    firstVisit: insights.firstVisit,
    lastVisit: insights.lastVisit,
    pagesVisited: insights.pagesVisited,
    currentSession: insights.currentSession,
    topPages: insights.topPages,
    daysSinceLastVisit: insights.daysSinceLastVisit,
  };
}
