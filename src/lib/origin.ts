/** Match the browser-facing Host, not Next's internal bind address. */
export function sameOrigin(req: Request) {
  const origin = req.headers.get("origin");
  const host = req.headers.get("host") || new URL(req.url).host;
  if (!origin) return false;
  try {
    const parsed = new URL(origin);
    return (
      ["https:", "http:"].includes(parsed.protocol) &&
      parsed.host === host &&
      parsed.origin === origin
    );
  } catch {
    return false;
  }
}
