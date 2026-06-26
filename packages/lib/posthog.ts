// Minimal server-side PostHog capture using fetch.
// Shared helper for API routes and server actions.

export type TelemetryProps = Record<string, any>;

const PH_SERVER_KEY =
  process.env.POSTHOG_API_KEY || process.env.POSTHOG_PERSONAL_API_KEY || "";
const PH_HOST = process.env.POSTHOG_HOST || "https://us.i.posthog.com";

export async function captureServer(
  distinctId: string | number | null | undefined,
  event: string,
  properties?: TelemetryProps
) {
  try {
    if (!PH_SERVER_KEY || !distinctId) return;
    const url = `${PH_HOST.replace(/\/$/, "")}/capture/`;
    const body = {
      api_key: PH_SERVER_KEY,
      event,
      distinct_id: String(distinctId),
      properties: sanitizeProps(properties),
    };
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (_) {
    // ignore telemetry failures
  }
}

export function sanitizeProps(input?: TelemetryProps): TelemetryProps | undefined {
  if (!input) return undefined;
  const out: TelemetryProps = {};
  for (const [k, v] of Object.entries(input)) {
    if (/content|prompt|body|text|html/i.test(k)) continue;
    out[k] = v;
  }
  return out;
}

