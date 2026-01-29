// ============================================
// Page Types
// ============================================

export interface Page {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  is_main_landing: boolean;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreatePageInput {
  slug: string;
  title: string;
  description?: string;
  is_main_landing?: boolean;
  enabled?: boolean;
}

export interface UpdatePageInput {
  id: string;
  slug?: string;
  title?: string;
  description?: string;
  is_main_landing?: boolean;
  enabled?: boolean;
}
