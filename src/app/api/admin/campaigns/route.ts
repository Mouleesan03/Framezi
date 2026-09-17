import { NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase/server";
import { sameOrigin, tinyJSON } from "@/lib/api";
import { campaignSchema } from "@/lib/validation";
import { z } from "zod";
export async function POST(req: Request) {
  if (!sameOrigin(req)) return new Response(null, { status: 403 });
  const db = await adminClient();
  if (!db) return new Response(null, { status: 401 });
  try {
    const campaign = campaignSchema.parse(await tinyJSON(req));
    const { data, error } = await db.rpc("save_campaign", {
      p_campaign: campaign,
    });
    if (error)
      return NextResponse.json(
        {
          error:
            error.code === "23505"
              ? "This campaign slug is already in use."
              : "Campaign could not be saved.",
        },
        { status: 400 },
      );
    return NextResponse.json({ id: data });
  } catch {
    return NextResponse.json(
      { error: "Check campaign fields, dates, frames, and download settings." },
      { status: 400 },
    );
  }
}
export async function DELETE(req: Request) {
  if (!sameOrigin(req)) return new Response(null, { status: 403 });
  const db = await adminClient();
  if (!db) return new Response(null, { status: 401 });
  try {
    const { id } = z
      .object({ id: z.uuid() })
      .strict()
      .parse(await tinyJSON(req));
    const { error } = await db.from("campaigns").delete().eq("id", id);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Unable to delete campaign" },
      { status: 400 },
    );
  }
}
