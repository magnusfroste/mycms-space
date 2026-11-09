// ============================================
// Page heading plan
// Ensures every block-based page has exactly one <h1>.
// ============================================

import type { PageBlock } from '@/types';

// Block types that render their own page-level <h1>
const H1_BLOCK_TYPES = ['chat-hero'];
// Block types whose section title can be promoted to the page <h1>
const HEADING_PROMOTABLE_BLOCK_TYPES = ['github'];

export interface HeadingPlan {
  /** Index of the block whose section title should render as <h1>, or -1 */
  promoteIndex: number;
  /** True when no block provides an <h1> and the page should render a fallback (sr-only) one */
  needsFallbackH1: boolean;
}

export const getHeadingPlan = (blocks: PageBlock[] | undefined): HeadingPlan => {
  if (!blocks || blocks.length === 0) return { promoteIndex: -1, needsFallbackH1: true };

  if (blocks.some((b) => H1_BLOCK_TYPES.includes(b.block_type))) {
    return { promoteIndex: -1, needsFallbackH1: false };
  }

  const first = blocks[0];
  const config = (first.block_config || {}) as Record<string, unknown>;
  const hasTitle = config.title !== '';
  if (HEADING_PROMOTABLE_BLOCK_TYPES.includes(first.block_type) && hasTitle) {
    return { promoteIndex: 0, needsFallbackH1: false };
  }

  return { promoteIndex: -1, needsFallbackH1: true };
};
