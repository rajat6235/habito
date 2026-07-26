// Recovery helpers for the "stuck on a stale service worker / cache" class of bugs.
// See public/sw.js for the caching strategy these assume.

const AUTO_RECOVERY_KEY = 'habito-auto-recovery-attempted';

/**
 * Chunk-load failures surface with different names/messages across browsers
 * (webpack's ChunkLoadError on Chromium, "Importing a module script failed" on
 * Safari, "error loading dynamically imported module" on Firefox) — this is the
 * exact failure a stale service worker cache produces when the HTML it served
 * references a build's asset hash that no longer exists on the server.
 */
export function isChunkLoadError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return (
    error.name === 'ChunkLoadError' ||
    /loading chunk [\w.-]+ failed/i.test(error.message) ||
    /failed to fetch dynamically imported module/i.test(error.message) ||
    /importing a module script failed/i.test(error.message) ||
    /error loading dynamically imported module/i.test(error.message)
  );
}

/** Unregisters the service worker and purges every Habito-owned cache. Best-effort. */
export async function clearStaleCaches(): Promise<void> {
  try {
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((r) => r.unregister()));
    }
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k.startsWith('habito-')).map((k) => caches.delete(k)));
    }
  } catch {
    // Best-effort — a failure here shouldn't block the reload that follows.
  }
}

/** Clears stale assets, then does a real navigation reload (not a client-side route change). */
export async function hardReload(): Promise<void> {
  await clearStaleCaches();
  window.location.reload();
}

/** Clears local persisted state (in case corrupted client state, not just stale assets, is the cause) and signs out. */
export function resetLocalDataAndSignOut(): void {
  try {
    localStorage.clear();
    sessionStorage.clear();
  } catch {
    // ignore
  }
  void clearStaleCaches().finally(() => {
    window.location.href = '/login';
  });
}

/**
 * Guards automatic recovery to once per browser session — if the app crashes again
 * right after an auto-reload, this returns false so callers fall back to showing the
 * manual recovery screen instead of looping forever.
 */
export function attemptAutoRecoveryOnce(): boolean {
  try {
    if (sessionStorage.getItem(AUTO_RECOVERY_KEY)) return false;
    sessionStorage.setItem(AUTO_RECOVERY_KEY, '1');
    return true;
  } catch {
    return false;
  }
}
