import { NextResponse } from "next/server";
import { registrationSchema } from "@/lib/validation";
import { configured, serviceClient } from "@/lib/supabase/server";
import {
  sameOrigin,
  tinyJSON,
  rateLimit,
  setParticipantToken,
} from "@/lib/api";
export async function POST(req: Request) {
  if (!sameOrigin(req))
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  if (!configured())
    return NextResponse.json(
      { error: "Registration is not configured" },
      { status: 503 },
    );
  try {
    const input = registrationSchema.parse(await tinyJSON(req));
    await rateLimit(req, "register", 30);
    const { data, error } = await serviceClient().rpc("register_participant", {
      p_campaign: input.campaign_id,
      p_name: input.name,
      p_email: input.email.toLowerCase(),
      p_marketing: input.marketing_consent,
    });
    if (error)
      return NextResponse.json(
        {
          error: error.message.includes("already registered")
            ? "This email is already registered for this campaign."
            : "Registration could not be completed. Check campaign availability and your details.",
        },
        { status: 400 },
      );
    await setParticipantToken(input.campaign_id, data);
    return NextResponse.json({ id: data });
  } catch (e) {
    return NextResponse.json(
      {
        error:
          e instanceof Error && e.message.includes("Too many")
            ? e.message
            : "Please check your details and try again.",
      },
      { status: 400 },
    );
  }
}
