import { NextResponse } from "next/server";
import { configured, serverClient, serviceClient } from "@/lib/supabase/server";
import { rateLimit, sameOrigin, tinyJSON } from "@/lib/api";
import { z } from "zod";

export async function POST(req: Request) {
  if (!sameOrigin(req))
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  if (!configured())
    return NextResponse.json(
      { error: "Connect Supabase to create Framezi profiles." },
      { status: 503 },
    );
  try {
    await rateLimit(req, "signup", 10);
    const { name, email, password } = z
      .object({
        name: z.string().trim().min(2).max(80),
        email: z.email().max(150),
        password: z.string().min(8).max(128),
      })
      .strict()
      .parse(await tinyJSON(req));
    const db = await serverClient();
    const { data, error } = await db.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    });
    if (error || !data.user)
      return NextResponse.json(
        { error: error?.message || "Account could not be created." },
        { status: 400 },
      );
    const service = serviceClient();
    const { error: profileError } = await service.from("profiles").upsert({
      id: data.user.id,
      email: data.user.email || email,
      full_name: name,
      role: "creator",
    });
    if (profileError) {
      await service.auth.admin.deleteUser(data.user.id);
      return NextResponse.json(
        { error: "Creator profile could not be created." },
        { status: 400 },
      );
    }
    if (!data.session) {
      await service.auth.admin.deleteUser(data.user.id);
      return NextResponse.json(
        {
          error:
            "Disable Confirm email in Supabase so creators can publish immediately without OTP.",
        },
        { status: 409 },
      );
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Check your name, email, and password and try again." },
      { status: 400 },
    );
  }
}
