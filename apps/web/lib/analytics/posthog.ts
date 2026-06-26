// Lightweight PostHog client wrapper with CDN loader and safe fallbacks.
// Avoids bundling posthog-js; loads from host at runtime when enabled.

declare global {
  interface Window {
    posthog?: {
      init: (key: string, config?: Record<string, any>) => void;
      capture: (event: string, props?: Record<string, any>) => void;
      identify: (distinctId: string, props?: Record<string, any>) => void;
      reset?: () => void;
      isFeatureEnabled?: (flag: string) => boolean;
      onFeatureFlags?: (cb: () => void) => void;
      startSessionRecording?: () => void;
      stopSessionRecording?: () => void;
      get_distinct_id?: () => string | undefined;
      register?: (props: Record<string, any>) => void;
      get_property?: (name: string) => any;
    };
  }
}

const PH_KEY =
  (typeof process !== "undefined" && process.env.NEXT_PUBLIC_POSTHOG_KEY) || "";
const PH_HOST =
  (typeof process !== "undefined" && process.env.NEXT_PUBLIC_POSTHOG_HOST) ||
  "https://us.i.posthog.com";

let loaded = false;

function loadCdn() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  // PostHog array snippet (slim) to queue calls until library loads
  (function (t: Document, e: any) {
    let o: any, n: any, p: any, r: any;
    if (e.__SV) return;
    window.posthog = e;
    e._i = [];
    e.init = function (i: any, s: any, a?: any) {
      function g(t: any, e: any) {
        const o = e.split(".");
        if (o.length === 2) t = t[o[0]], (e = o[1]);
        // @ts-ignore
        t[e] = function () {
          // @ts-ignore
          t.push([e].concat(Array.prototype.slice.call(arguments, 0)));
        };
      }
      (p = t.createElement("script")).type = "text/javascript";
      p.async = !0;
      // @ts-ignore
      p.src = (s && s.api_host ? s.api_host : PH_HOST) + "/static/array.js";
      (r = t.getElementsByTagName("script")[0]).parentNode?.insertBefore(p, r);
      const u = e;
      const methods = [
        "capture",
        "identify",
        "alias",
        "people.set",
        "people.set_once",
        "set_config",
        "register",
        "register_once",
        "unregister",
        "opt_out_capturing",
        "has_opted_out_capturing",
        "opt_in_capturing",
        "reset",
        "isFeatureEnabled",
        "onFeatureFlags",
        "group",
        "startSessionRecording",
        "stopSessionRecording",
        "get_distinct_id",
        "get_property",
      ];
      for (n = 0; n < methods.length; n++) g(u, methods[n]);
      e._i.push([i, s, a]);
    };
    e.__SV = 1;
  })(document, window.posthog || ({} as any));

  window.posthog?.init?.(PH_KEY, {
    api_host: PH_HOST,
    capture_pageview: false,
    autocapture: true,
    disable_session_recording: true,
  });
}

export function initPostHogOnce(opts?: { enableRecording?: boolean }) {
  if (!PH_KEY) return;
  loadCdn();
  if (opts?.enableRecording) {
    // Will be a no-op until real library loads
    window.posthog?.startSessionRecording?.();
  }
}

export function capture(event: string, props?: Record<string, any>) {
  if (!PH_KEY) return;
  try {
    window.posthog?.capture?.(event, props);
  } catch (_) {
    // swallow
  }
}

export function identify(distinctId: string, props?: Record<string, any>) {
  if (!PH_KEY) return;
  try {
    window.posthog?.identify?.(distinctId, props);
  } catch (_) {
    // swallow
  }
}

export function isFlagEnabled(flag: string): boolean {
  try {
    return !!window.posthog?.isFeatureEnabled?.(flag);
  } catch (_) {
    return false;
  }
}

export default { initPostHogOnce, capture, identify, isFlagEnabled };

