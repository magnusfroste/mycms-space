import { describe, expect, it } from 'vitest';
import { isLovableEditorOrigin } from '../FrameGuard';

describe('isLovableEditorOrigin', () => {
  it('trusts only HTTPS Lovable editor origins', () => {
    expect(isLovableEditorOrigin('https://lovable.dev')).toBe(true);
    expect(isLovableEditorOrigin('https://www.lovable.dev')).toBe(true);
    expect(isLovableEditorOrigin('https://gptengineer.app')).toBe(true);
  });

  it('rejects external, insecure, and lookalike origins', () => {
    expect(isLovableEditorOrigin('https://example.com')).toBe(false);
    expect(isLovableEditorOrigin('http://lovable.dev')).toBe(false);
    expect(isLovableEditorOrigin('https://lovable.dev.evil.example')).toBe(false);
    expect(isLovableEditorOrigin('https://id-preview--project.lovable.app')).toBe(false);
    expect(isLovableEditorOrigin('')).toBe(false);
  });
});
