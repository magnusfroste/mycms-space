// ============================================
// useUnsavedChanges Hook
// Tracks dirty state and warns on page leave
// ============================================

import { useState, useCallback, useEffect, useRef } from 'react';

interface UseUnsavedChangesOptions {
  /** Enable browser warning on page leave (default: true) */
  warnOnLeave?: boolean;
  /** Callback when save is triggered */
  onSave?: () => Promise<void>;
}

interface UseUnsavedChangesReturn<T> {
  /** Current local state */
  data: T;
  /** Update local state (marks as dirty) */
  setData: (value: T | ((prev: T) => T)) => void;
  /** Whether there are unsaved changes */
  isDirty: boolean;
  /** Mark as clean (after successful save) */
  markClean: () => void;
  /** Mark as dirty manually */
  markDirty: () => void;
  /** Reset to initial value */
  reset: () => void;
  /** Whether a save operation is in progress */
  isSaving: boolean;
  /** Set saving state */
  setIsSaving: (value: boolean) => void;
}

/**
 * Hook for tracking unsaved changes with browser warning
 * 
 * @param initialValue - Initial state value
 * @param options - Configuration options
 * @returns State management utilities for unsaved changes
 * 
 * @example
 * ```tsx
 * const { data, setData, isDirty, markClean, isSaving, setIsSaving } = useUnsavedChanges(initialConfig);
 * 
 * const handleSave = async () => {
 *   setIsSaving(true);
 *   await saveToDatabase(data);
 *   markClean();
 *   setIsSaving(false);
 * };
 * 
 * return (
 *   <>
 *     <Input value={data.title} onChange={e => setData(prev => ({ ...prev, title: e.target.value }))} />
 *     <Button onClick={handleSave} disabled={!isDirty || isSaving}>
 *       {isSaving ? 'Saving...' : 'Save'}
 *     </Button>
 *   </>
 * );
 * ```
 */
export function useUnsavedChanges<T>(
  initialValue: T,
  options: UseUnsavedChangesOptions = {}
): UseUnsavedChangesReturn<T> {
  const { warnOnLeave = true } = options;
  
  const [data, setDataInternal] = useState<T>(initialValue);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const initialValueRef = useRef(initialValue);

  // Update initial value ref when it changes (e.g., from server refetch)
  useEffect(() => {
    initialValueRef.current = initialValue;
    // Reset data if not dirty (sync with server state)
    if (!isDirty) {
      setDataInternal(initialValue);
    }
  }, [initialValue, isDirty]);

  // Browser warning on page leave
  useEffect(() => {
    if (!warnOnLeave || !isDirty) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
      return e.returnValue;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty, warnOnLeave]);

  const setData = useCallback((value: T | ((prev: T) => T)) => {
    setDataInternal(value);
    setIsDirty(true);
  }, []);

  const markClean = useCallback(() => {
    setIsDirty(false);
  }, []);

  const markDirty = useCallback(() => {
    setIsDirty(true);
  }, []);

  const reset = useCallback(() => {
    setDataInternal(initialValueRef.current);
    setIsDirty(false);
  }, []);

  return {
    data,
    setData,
    isDirty,
    markClean,
    markDirty,
    reset,
    isSaving,
    setIsSaving,
  };
}

export default useUnsavedChanges;
