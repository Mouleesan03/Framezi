import { NextResponse } from "next/server";
import { eventSchema } from "@/lib/validation";
import { configured, serviceClient } from "@/lib/supabase/server";
import { sameOrigin, tinyJSON, rateLimit, verifyParticipant } from "@/lib/api";
export async function POST(req: Request) {
  if (!sameOrigin(req))
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  if (!configured())
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  try {
    const i = eventSchema.parse(await tinyJSON(req));
    await rateLimit(req, "events", 500);
    if (
      i.event_type !== "campaign_view" &&
      (!i.submission_id ||
        !(await verifyParticipant(i.campaign_id, i.submission_id)))
    )
      return NextResponse.json(
        { error: "Registration required" },
        { status: 403 },
      );
    const { error } = await serviceClient().rpc("record_event", {
      p_campaign: i.campaign_id,
      p_participant: i.submission_id || null,
      p_event: i.event_type,
      p_frame: i.frame_id || null,
      p_generation: i.generation_id || null,
    });
    if (error)
      return NextResponse.json({ error: "Event rejected" }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Invalid event" }, { status: 400 });
  }
}
