import { NextResponse } from "next/server";
import { serverClient } from "@/lib/supabase/server";
import { sameOrigin } from "@/lib/api";
export async function POST(req: Request) {
  if (!sameOrigin(req)) return new Response(null, { status: 403 });
  await (await serverClient()).auth.signOut();
  return NextResponse.json({ ok: true });
}
