import { NextResponse } from "next/server";
import { configured, serverClient } from "@/lib/supabase/server";
import { sameOrigin, tinyJSON, rateLimit } from "@/lib/api";
import { z } from "zod";
export async function POST(req: Request) {
  if (!sameOrigin(req))
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  if (!configured())
    return NextResponse.json(
      { error: "Connect Supabase to enable administrator sign-in." },
      { status: 503 },
    );
  try {
    await rateLimit(req, "login", 20);
    const { email, password } = z
      .object({
        email: z.email().max(150),
        password: z.string().min(1).max(128),
      })
      .strict()
      .parse(await tinyJSON(req));
    const db = await serverClient();
    const { data, error } = await db.auth.signInWithPassword({
      email,
      password,
    });
    if (error || !data.user)
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 },
      );
    const { data: profile } = await db
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .single();
    if (!profile || !["admin", "creator"].includes(profile.role)) {
      await db.auth.signOut();
      return NextResponse.json(
        { error: "Framezi creator access required." },
        { status: 403 },
      );
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Sign-in unavailable. Check your details or try again later." },
      { status: 400 },
    );
  }
}
