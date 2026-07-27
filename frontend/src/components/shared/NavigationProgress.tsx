'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useNavigationStore } from '@/stores/navigation.store';

// Safety net. Two things this bounds:
// 1. A navigation that never resolves (an aborted fetch, a route that errors
//    before swapping) must not leave the bar stuck on screen forever.
// 2. Not every pushState/replaceState call is a visible navigation — Next.js
//    also uses the History API for same-page bookkeeping (scroll restoration,
//    router.refresh()). Those never change the pathname, so without this bound
//    the bar would otherwise sit lit until something else happened to call
//    done(). Kept short so that false-positive case self-corrects quickly
//    without ever cutting off a genuinely slow real navigation's initial feedback.
const NAV_TIMEOUT_MS = 2_500;

/**
 * A slim top-of-viewport progress bar, the same idea as Vercel/GitHub/Linear use,
 * that gives instant feedback the moment ANY client-side navigation starts —
 * whether it's a <Link> click or a programmatic router.push()/replace(). Both
 * go through the History API under the hood, so patching pushState/replaceState
 * here catches every navigation in one place instead of threading a "start"
 * call through every call site in the app.
 */
export function NavigationProgress() {
  const isNavigating = useNavigationStore((s) => s.isNavigating);
  const start = useNavigationStore((s) => s.start);
  const done  = useNavigationStore((s) => s.done);
  const pathname = usePathname();
  const prevPathname = useRef(pathname);

  // The route actually changed — that's the true "navigation finished" signal.
  useEffect(() => {
    if (pathname !== prevPathname.current) {
      prevPathname.current = pathname;
      done();
    }
  }, [pathname, done]);

  useEffect(() => {
    const origPush    = window.history.pushState.bind(window.history);
    const origReplace = window.history.replaceState.bind(window.history);

    function wrap(fn: typeof origPush) {
      return function patched(this: unknown, ...args: Parameters<typeof origPush>) {
        // Next.js's own router calls pushState/replaceState from inside a
        // useInsertionEffect (see HistoryUpdater) — React forbids scheduling
        // updates synchronously from there. Deferring the store update to a
        // macrotask steps outside that phase entirely while leaving the real
        // history call untouched and synchronous, so Next's own routing is
        // never delayed — only our own "start the bar" side effect is.
        setTimeout(start, 0);
        return fn(...args);
      };
    }

    window.history.pushState    = wrap(origPush);
    window.history.replaceState = wrap(origReplace);
    return () => {
      window.history.pushState    = origPush;
      window.history.replaceState = origReplace;
    };
  }, [start]);

  useEffect(() => {
    if (!isNavigating) return;
    const timer = setTimeout(done, NAV_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [isNavigating, done]);

  if (!isNavigating) return null;

  return (
    <div
      role="progressbar"
      aria-label="Page loading"
      className="fixed top-0 left-0 right-0 z-[9999] h-[3px] overflow-hidden bg-primary/10 pointer-events-none"
    >
      <div className="h-full w-1/3 bg-primary animate-nav-progress" />
    </div>
  );
}
