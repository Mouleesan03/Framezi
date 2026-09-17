import "server-only";
import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { serviceClient } from "./supabase/server";
export { sameOrigin } from "./origin";
export async function tinyJSON(req: Request) {
  if (!req.headers.get("content-type")?.startsWith("application/json"))
    throw new Error("JSON required");
  const reader = req.body?.getReader();
  if (!reader) throw new Error("Missing body");
  let size = 0;
  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > 32768) {
      await reader.cancel();
      throw new Error("Request too large");
    }
    chunks.push(value);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}
function secret() {
  const s =
    process.env.RATE_LIMIT_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!s) throw new Error("Rate limit secret missing");
  return s;
}
export async function rateLimit(req: Request, kind: string, limit = 30) {
  const address =
    req.headers.get("x-vercel-forwarded-for")?.split(",")[0] ||
    req.headers.get("x-forwarded-for")?.split(",")[0] ||
    "local";
  const key = createHmac("sha256", secret())
    .update(`${kind}:${address}:${new Date().toISOString().slice(0, 13)}`)
    .digest("hex");
  const { data, error } = await serviceClient().rpc("check_rate_limit", {
    p_key: key,
    p_limit: limit,
  });
  if (error || !data)
    throw new Error("Too many requests. Please try again later.");
}
export async function setParticipantToken(campaign: string, id: string) {
  const payload = `${id}.${Date.now() + 86400000}`;
  const signature = createHmac("sha256", secret())
    .update(`${campaign}:${payload}`)
    .digest("hex");
  (await cookies()).set(`fz_${campaign}`, `${payload}.${signature}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 86400,
    path: "/api/events",
  });
}
export async function verifyParticipant(campaign: string, id: string) {
  const raw = (await cookies()).get(`fz_${campaign}`)?.value;
  if (!raw) return false;
  const [pid, expiry, sig] = raw.split(".");
  if (pid !== id || Number(expiry) < Date.now() || !sig) return false;
  const expected = createHmac("sha256", secret())
    .update(`${campaign}:${pid}.${expiry}`)
    .digest("hex");
  return (
    sig.length === expected.length &&
    timingSafeEqual(Buffer.from(sig), Buffer.from(expected))
  );
}
export { randomUUID };
