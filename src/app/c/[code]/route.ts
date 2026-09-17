import { NextRequest, NextResponse } from "next/server";
import { configured, serverClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  if (code === "uoj41") return NextResponse.redirect(new URL("/uoj-convocation-2026", request.url));
  if (!configured()) return new NextResponse("Campaign not found", { status: 404 });

  const db = await serverClient();
  const { data } = await db.from("campaigns").select("slug").eq("short_code", code).eq("status", "published").single();
  if (!data) return new NextResponse("Campaign not found", { status: 404 });
  return NextResponse.redirect(new URL(`/${data.slug}`, request.url));
}
