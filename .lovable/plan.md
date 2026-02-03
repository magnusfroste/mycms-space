
# Refactoring Plan: Fix Global Dialog/Popover Closing Issue

## Problem Analysis

After thorough investigation, I've identified a systemic issue affecting multiple overlay components (Dialog, Popover, DropdownMenu) across the admin panel. The symptoms include:
- AI menu disappearing immediately when expanded
- Blog post creation dialog closing unexpectedly
- Project modal ("View More") closing instantly
- Navigation link dialogs not staying open

### Root Cause

The issue stems from a combination of factors:

1. **Radix UI Focus Management Conflicts**: When using `DialogTrigger` with controlled state (`open`/`onOpenChange`), there can be race conditions between the trigger's internal state and the external controlled state.

2. **React Query Background Refetches**: Some components have realtime subscriptions or React Query background refetches that cause parent re-renders, which can destabilize overlay components.

3. **Inconsistent Pattern Usage**: Some dialogs mix `DialogTrigger` with controlled state, creating conflicts. The fix applied to `NavSettings.tsx` (using `onPointerDownOutside`/`onInteractOutside`) works, but the root pattern needs to be applied globally.

## Solution: Global Radix Overlay Stability Fix

Rather than patching each component individually, I'll implement a two-pronged approach:

### Part 1: Create Stable Dialog/Popover Wrapper Components

Create enhanced versions of the overlay components that include stability fixes by default.

```text
+---------------------------+
|  Stable Dialog Pattern    |
+---------------------------+
| - Separate trigger from   |
|   dialog (no DialogTrigger|
|   with controlled state)  |
| - Add onPointerDownOutside|
|   and onInteractOutside   |
|   handlers                |
| - Use stable references   |
+---------------------------+
```

### Part 2: Apply Fix to All Affected Components

Update these components to use the stable pattern:

| Component | Current Issue | Fix |
|-----------|--------------|-----|
| `ProjectModal.tsx` | No stability handlers | Add `onPointerDownOutside`/`onInteractOutside` |
| `AITextActions.tsx` | Uses button toggle (OK) | Verify stability |
| `LandingPageManager.tsx` | `Dialog` with `DialogTrigger` + controlled | Decouple trigger |
| `BlockSettings.tsx` | `DialogTrigger asChild` + controlled | Decouple trigger |
| `ClassicPageBuilder.tsx` | Same issue | Decouple trigger |
| `PageManager.tsx` | Same issue | Decouple trigger |
| `BlogPostEditor.tsx` | `Popover` components | Add stability handlers |

### Part 3: Add Global Error Boundary

Add an unhandled rejection handler to prevent async errors from crashing the app (recommended in the Stack Overflow solution).

---

## Technical Implementation

### Step 1: Create Stable Dialog Component
Create `src/components/ui/stable-dialog.tsx` with built-in stability handlers:
- Wraps existing Dialog components
- Automatically includes `onPointerDownOutside={(e) => e.preventDefault()}`
- Automatically includes `onInteractOutside={(e) => e.preventDefault()}`

### Step 2: Update Vite Config
Add React deduplication to prevent multiple React instances:
```typescript
resolve: {
  dedupe: ["react", "react-dom", "react/jsx-runtime"],
}
```

### Step 3: Apply Pattern to Each Component

**Pattern to use (stable):**
```tsx
// Trigger is a regular button, not DialogTrigger
<Button onClick={() => setIsOpen(true)}>Open</Button>

<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent 
    onPointerDownOutside={(e) => e.preventDefault()}
    onInteractOutside={(e) => e.preventDefault()}
  >
    {/* content */}
  </DialogContent>
</Dialog>
```

**Components requiring updates:**
1. `src/components/ProjectModal.tsx` - Add stability handlers
2. `src/components/admin/BlockSettings.tsx` - Decouple DialogTrigger
3. `src/components/admin/ClassicPageBuilder.tsx` - Decouple DialogTrigger
4. `src/components/admin/PageManager.tsx` - Decouple DialogTrigger
5. `src/components/admin/LandingPageManager.tsx` - Add stability handlers to Dialog
6. `src/components/admin/block-editor/BlogPostEditor.tsx` - Add stability handlers to Popover

### Step 4: Add Global Error Handler
Add to `src/App.tsx`:
```typescript
useEffect(() => {
  const handleRejection = (event: PromiseRejectionEvent) => {
    console.error("Unhandled rejection:", event.reason);
    event.preventDefault();
  };
  window.addEventListener("unhandledrejection", handleRejection);
  return () => window.removeEventListener("unhandledrejection", handleRejection);
}, []);
```

---

## Files to Modify

1. `vite.config.ts` - Add React deduplication
2. `src/App.tsx` - Add global error handler
3. `src/components/ProjectModal.tsx` - Add stability handlers
4. `src/components/admin/BlockSettings.tsx` - Decouple DialogTrigger + add handlers
5. `src/components/admin/ClassicPageBuilder.tsx` - Decouple DialogTrigger + add handlers
6. `src/components/admin/PageManager.tsx` - Decouple DialogTrigger + add handlers
7. `src/components/admin/LandingPageManager.tsx` - Add stability handlers
8. `src/components/admin/block-editor/BlogPostEditor.tsx` - Add Popover stability handlers

---

## Summary

This refactoring addresses the root cause by:
1. Preventing duplicate React instances via Vite config
2. Adding global error handling to prevent async crashes
3. Systematically applying stability fixes to all overlay components
4. Decoupling triggers from controlled state where needed

This approach fixes all affected components with a consistent pattern rather than patching each issue individually.
