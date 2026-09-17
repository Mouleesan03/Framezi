import { NextRequest, NextResponse } from "next/server";
import { configured, serverClient } from "@/lib/supabase/server";
import { demoCampaigns } from "@/lib/demo";

export async function GET(request: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  if (!configured()) {
    const campaign = demoCampaigns.find((item) => item.short_code === code);
    if (campaign) return NextResponse.redirect(new URL(`/${campaign.slug}`, request.url));
    return new NextResponse("Campaign not found", { status: 404 });
  }

  const db = await serverClient();
  const { data } = await db.from("campaigns").select("slug").eq("short_code", code).eq("status", "published").single();
  if (!data) return new NextResponse("Campaign not found", { status: 404 });
  return NextResponse.redirect(new URL(`/${data.slug}`, request.url));
}
