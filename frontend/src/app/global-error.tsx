'use client';

// This replaces the ENTIRE root layout when it fires (a crash the root layout itself
// couldn't render past), so it deliberately does not depend on globals.css or Tailwind
// being available — everything here is inline-styled to guarantee it always renders
// legibly, on every browser, with zero dependencies.

import { useEffect, useState } from 'react';
import { isChunkLoadError, hardReload, resetLocalDataAndSignOut, attemptAutoRecoveryOnce } from '@/lib/pwaRecovery';

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [autoRecovering, setAutoRecovering] = useState(false);

  useEffect(() => {
    console.error('Unhandled root-level application error:', error);
    if (isChunkLoadError(error) && attemptAutoRecoveryOnce()) {
      setAutoRecovering(true);
      void hardReload();
    }
  }, [error]);

  return (
    <html lang="en">
      <body style={{
        margin: 0,
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '0 24px',
        backgroundColor: '#0c0e1a',
        color: '#f4f4f6',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}>
        {autoRecovering ? (
          <p style={{ fontSize: 14, color: '#a1a1aa' }}>Updating Habito…</p>
        ) : (
          <>
            <p style={{ fontSize: 22, fontWeight: 800, marginBottom: 32 }}>✦ habito</p>
            <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Something went wrong</h1>
            <p style={{ fontSize: 14, color: '#a1a1aa', marginBottom: 28, maxWidth: 320 }}>
              Habito hit an unexpected error and couldn&rsquo;t load. Reloading usually fixes it.
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => void hardReload()}
                style={{
                  padding: '10px 18px',
                  borderRadius: 8,
                  border: 'none',
                  backgroundColor: '#6d60f0',
                  color: '#fff',
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                Reload app
              </button>
            </div>
            <button
              onClick={resetLocalDataAndSignOut}
              style={{
                marginTop: 28,
                background: 'none',
                border: 'none',
                color: '#a1a1aa',
                fontSize: 12,
                textDecoration: 'underline',
                cursor: 'pointer',
              }}
            >
              Still stuck? Reset local data &amp; sign out
            </button>
          </>
        )}
      </body>
    </html>
  );
}
