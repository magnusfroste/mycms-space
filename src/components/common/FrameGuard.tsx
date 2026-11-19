// ============================================
// Frame guard — admin and OAuth consent must not run inside another site's
// frame (clickjacking). The host sends no X-Frame-Options or CSP
// frame-ancestors header, so the pages refuse to render when framed.
// ============================================

/** True when the page runs inside a frame. */
export const isFramed = () => {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
};

// Match the same trusted editor origins used by the preview session bridge.
// Subdomains of lovable.app are user sites and must never be trusted here.
export const isLovableEditorOrigin = (origin: string) =>
  /^https:\/\/([a-z0-9-]+\.)*(lovable\.dev|gptengineer\.app)$/.test(origin);

/** Admin may run in Lovable's editor preview, but not in arbitrary frames. */
export const isAdminFrameBlocked = () => {
  if (!isFramed()) return false;

  try {
    const ancestorOrigins = window.location.ancestorOrigins as DOMStringList | undefined;
    const ancestor = ancestorOrigins?.[0] ?? (document.referrer ? new URL(document.referrer).origin : '');
    return !isLovableEditorOrigin(ancestor);
  } catch {
    return true;
  }
};

export function FramedNotice() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 text-center text-sm">
      <p>
        For your safety this page cannot be shown inside another site.{' '}
        <a href={window.location.href} target="_top" rel="noopener" className="underline">
          Open it directly
        </a>
        .
      </p>
    </div>
  );
}
