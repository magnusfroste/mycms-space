
# Theme System Refactoring Plan

## Problem Summary

The current codebase has **three competing theme systems** that fight for control:

1. **`next-themes`** - Manages `.dark` class for light/dark mode
2. **`data-theme`** - Branding templates (elegant/grok/sana)
3. **`data-section-theme`** - Scroll-triggered section backgrounds

This creates race conditions, CSS conflicts, and unpredictable behavior.

## Solution: Unified Single Theme System

Remove all complexity and use **only `data-theme`** with one attribute that controls everything.

```text
CURRENT (3 systems fighting):
┌──────────────────────────────────────────┐
│  next-themes (.dark class)               │──┐
│  data-theme (elegant/grok/sana)          │──┼─→ CONFLICTS!
│  data-section-theme (scroll-triggered)   │──┘
└──────────────────────────────────────────┘

NEW (1 unified system):
┌──────────────────────────────────────────┐
│  data-theme="sana" (single source)       │
│  - Defines ALL colors for that theme     │
│  - No .dark class needed                 │
│  - No scroll-triggered overrides         │
└──────────────────────────────────────────┘
```

---

## Phase 1: Remove Complexity

### 1.1 Remove `next-themes` Package

**Files to modify:**
- `src/App.tsx` - Remove `ThemeProvider` wrapper
- `src/components/ThemeToggle.tsx` - Delete file (temporarily, can restore later)
- `src/components/Header.tsx` - Remove `ThemeToggle` import and usage
- `src/pages/Chat.tsx` - Remove `ThemeToggle` import and usage
- `src/hooks/useBrandingTheme.ts` - Remove `useTheme` from next-themes

### 1.2 Remove Scroll-Triggered Themes

**Files to delete:**
- `src/hooks/useScrollTheme.ts` - Delete entirely
- `src/components/blocks/ScrollThemeSection.tsx` - Delete entirely

**Files to modify:**
- `src/components/blocks/BlockRenderer.tsx` - Remove `ScrollThemeSection` wrapper
- `src/index.css` - Remove lines 716-835 (all `data-section-theme` CSS, ~120 lines)

---

## Phase 2: Simplify Branding Hook

### 2.2 New `useBrandingTheme.ts`

Simple hook that only sets `data-theme` once on mount:

```typescript
import { useEffect } from 'react';
import { useModule } from '@/models/modules';
import type { BrandingModuleConfig } from '@/types/modules';

export const useBrandingTheme = () => {
  const { data: module, isLoading } = useModule('branding');
  
  useEffect(() => {
    if (isLoading || !module) return;
    
    const config = module.module_config as BrandingModuleConfig | undefined;
    const theme = config?.theme || 'elegant';
    
    // Single source of truth - just set the attribute
    if (theme === 'elegant') {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', theme);
    }
    
    console.log('[Branding] Applied theme:', theme);
  }, [module, isLoading]);
  
  return {
    theme: (module?.module_config as BrandingModuleConfig | undefined)?.theme || 'elegant',
    isLoading,
  };
};
```

---

## Phase 3: Simplify CSS

### 3.1 CSS Structure After Cleanup

From **835 lines** to approximately **550 lines**.

**Remove:**
- All `data-section-theme` rules (lines 716-835) - 120 lines
- `.dark` variants for each theme - consolidate into single theme definitions
- `force_dark` option from BrandingModuleConfig

**Keep:**
- `:root` base variables
- `[data-theme="grok"]` - full theme definition
- `[data-theme="sana"]` - full theme definition
- Component styles (glass-card, btn-primary, etc.)

### 3.2 Theme Definitions

Each theme defines its own complete color palette (no light/dark variants for now):

```css
/* Elegant = default, no data-theme needed */
:root {
  --background: 220 20% 97%;
  --foreground: 220 25% 10%;
  /* ... rest of colors */
}

/* Grok - Sharp minimal */
[data-theme="grok"] {
  --background: 0 0% 98%;
  --foreground: 0 0% 8%;
  /* ... complete palette */
}

/* Sana - Clean professional */
[data-theme="sana"] {
  --background: 0 0% 100%;
  --foreground: 0 0% 10%;
  /* ... complete palette */
}
```

---

## Phase 4: Update Admin UI

### 4.1 Simplify BrandingSettings.tsx

Remove `force_dark` toggle since we're removing dark mode for now.

**Before:**
- Theme selector (elegant/grok/sana)
- Force Dark Mode toggle

**After:**
- Theme selector only
- Pro tip about future light/dark mode support

### 4.2 Update HeaderModuleConfig

Remove `show_theme_toggle` option since there's no toggle anymore.

---

## Phase 5: Prepare for Future Dark/Light Mode

Create architecture that makes it easy to add back later:

### 5.1 Reserved CSS Structure

Keep `.dark` variants in CSS but commented out:

```css
/* FUTURE: Dark mode variants
[data-theme="sana"].dark {
  --background: 240 10% 6%;
  ...
}
*/
```

### 5.2 Reserved Config Fields

Keep in TypeScript types but mark as optional/deprecated:

```typescript
interface BrandingModuleConfig {
  theme: 'elegant' | 'grok' | 'sana';
  // Future: Re-enable when dark mode is added back
  // force_dark?: boolean;
  // color_mode?: 'light' | 'dark' | 'system';
}
```

---

## Summary of Changes

| File | Action |
|------|--------|
| `src/App.tsx` | Remove `ThemeProvider`, keep `useBrandingTheme` |
| `src/components/ThemeToggle.tsx` | Delete |
| `src/components/Header.tsx` | Remove ThemeToggle usage |
| `src/pages/Chat.tsx` | Remove ThemeToggle usage |
| `src/hooks/useBrandingTheme.ts` | Simplify to single attribute |
| `src/hooks/useScrollTheme.ts` | Delete |
| `src/components/blocks/ScrollThemeSection.tsx` | Delete |
| `src/components/blocks/BlockRenderer.tsx` | Remove ScrollThemeSection wrapper |
| `src/index.css` | Remove ~280 lines (section themes + .dark variants) |
| `src/components/admin/BrandingSettings.tsx` | Remove force_dark toggle |
| `src/types/modules.ts` | Simplify BrandingModuleConfig |

## Expected Outcome

- **Theme switching works reliably** - Single data-theme attribute, no conflicts
- **~280 fewer CSS lines** - Easier to maintain
- **No race conditions** - No multiple systems fighting
- **Architecture ready** - Easy to add dark mode back when needed
