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
