import "server-only";
import { configured, serverClient } from "./supabase/server";
import { demoCampaign } from "./demo";
import type { Campaign } from "./types";
export async function getCampaign(slug: string): Promise<Campaign | null> {
  if (!configured()) return slug === demoCampaign.slug ? demoCampaign : null;
  const db = await serverClient();
  const { data, error } = await db
    .from("campaigns")
    .select("*,frames:campaign_frames(*)")
    .eq("slug", slug)
    .single();
  if (error) return null;
  return data as Campaign;
}

export async function getCampaignUsage(campaignId: string) {
  if (!configured()) return 0;
  const db = await serverClient();
  const { data, error } = await db.rpc("campaign_usage_count", { p_campaign: campaignId });
  if (error) return 0;
  return Number(data || 0);
}
