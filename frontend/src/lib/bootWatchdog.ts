// Inline boot-watchdog script, embedded directly into the HTML document (see layout.tsx) —
// NOT a Next.js chunk. This is deliberate: everything else that could show a recovery UI
// (error.tsx, global-error.tsx, the RecoveryScreen component) is itself code-split JS that
// can fail to load in exactly the scenario we're guarding against (a stale service worker
// serving HTML that references a build whose chunks no longer exist on the server). This
// script has zero dependencies, so it can never be taken out by the same failure it exists
// to catch.
//
// Contract: the app calls window.__habitoSignalMounted() as soon as the root client
// component tree successfully renders (see Providers in src/providers/index.tsx) — it
// doesn't wait for auth/data to finish loading, only that React is alive and rendering
// *something*. If that signal doesn't arrive within the timeout, the watchdog assumes the
// bundle failed to load or hung, and renders a minimal, dependency-free recovery UI.
export const BOOT_WATCHDOG_SCRIPT = `(function () {
  var TIMEOUT_MS = 12000;
  window.__HABITO_MOUNTED__ = false;
  window.__habitoSignalMounted = function () { window.__HABITO_MOUNTED__ = true; };

  setTimeout(function () {
    if (window.__HABITO_MOUNTED__) return;
    if (document.getElementById('habito-boot-watchdog')) return;

    var overlay = document.createElement('div');
    overlay.id = 'habito-boot-watchdog';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:2147483647;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:24px;background:#0c0e1a;color:#f4f4f6;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;';
    overlay.innerHTML =
      '<p style="font-size:22px;font-weight:800;margin-bottom:32px;">\\u2726 habito</p>' +
      '<h1 style="font-size:20px;font-weight:700;margin-bottom:8px;">Taking longer than usual</h1>' +
      '<p style="font-size:14px;color:#a1a1aa;margin-bottom:24px;max-width:300px;">Habito did not finish loading. This usually happens right after an update \\u2014 reloading fixes it.</p>' +
      '<button id="habito-boot-reload" style="padding:10px 18px;border-radius:8px;border:none;background:#6d60f0;color:#fff;font-size:14px;font-weight:500;">Reload app</button>';
    document.body.appendChild(overlay);

    document.getElementById('habito-boot-reload').addEventListener('click', function () {
      function done() { window.location.reload(); }
      try {
        var tasks = [];
        if (window.caches) {
          tasks.push(caches.keys().then(function (keys) {
            return Promise.all(keys.filter(function (k) { return k.indexOf('habito-') === 0; }).map(function (k) { return caches.delete(k); }));
          }));
        }
        if (navigator.serviceWorker) {
          tasks.push(navigator.serviceWorker.getRegistrations().then(function (regs) {
            return Promise.all(regs.map(function (r) { return r.unregister(); }));
          }));
        }
        Promise.all(tasks).then(done).catch(done);
      } catch (e) {
        done();
      }
    });
  }, TIMEOUT_MS);
})();`;
