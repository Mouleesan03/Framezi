import { NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase/server";
import { sameOrigin } from "@/lib/api";
import { randomUUID } from "node:crypto";
// Administrator-owned campaign assets only. Visitor photos never use this endpoint.
export async function POST(req: Request) {
  if (!sameOrigin(req)) return new Response(null, { status: 403 });
  const db = await adminClient();
  if (!db) return new Response(null, { status: 401 });
  const kind = new URL(req.url).searchParams.get("kind");
  const type = req.headers.get("content-type") || "";
  if (
    !["image/png", "image/jpeg", "image/webp"].includes(type) ||
    (kind === "frame" && type !== "image/png")
  )
    return NextResponse.json(
      { error: "Use a PNG for frames, or PNG/JPG/WEBP for branding." },
      { status: 400 },
    );
  const reader = req.body?.getReader();
  if (!reader) return new Response(null, { status: 400 });
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > 4 * 1024 * 1024) {
      await reader.cancel();
      return NextResponse.json(
        { error: "Asset must be smaller than 4 MB." },
        { status: 413 },
      );
    }
    chunks.push(value);
  }
  const bytes = Buffer.concat(chunks);
  const png = bytes
    .subarray(0, 8)
    .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  const jpg = bytes[0] === 255 && bytes[1] === 216;
  const webp =
    bytes.toString("ascii", 0, 4) === "RIFF" &&
    bytes.toString("ascii", 8, 12) === "WEBP";
  if (!(type === "image/png" ? png : type === "image/jpeg" ? jpg : webp))
    return NextResponse.json({ error: "Invalid image file." }, { status: 400 });
  const path = `${randomUUID()}.${type.split("/")[1]}`;
  const { error } = await db.storage
    .from("campaign-assets")
    .upload(path, bytes, { contentType: type, upsert: false });
  if (error)
    return NextResponse.json(
      { error: "Asset upload failed. Check storage setup." },
      { status: 400 },
    );
  return NextResponse.json({
    url: db.storage.from("campaign-assets").getPublicUrl(path).data.publicUrl,
  });
}
