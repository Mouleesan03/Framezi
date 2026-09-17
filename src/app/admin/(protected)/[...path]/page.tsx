import { notFound, redirect } from "next/navigation";
import { creatorAccount } from "@/lib/supabase/server";
import { emptyCampaign } from "@/lib/demo";
import type { Campaign, Participant, Event } from "@/lib/types";
import CampaignForm from "@/components/CampaignForm";
import AdminViews from "@/components/AdminViews";
export default async function Page({
  params,
}: {
  params: Promise<{ path: string[] }>;
}) {
  const { path } = await params;
  const account = await creatorAccount();
  if (!account) redirect("/admin");
  const db = account.client;
  if (path.join("/") === "campaigns/new")
    return <CampaignForm initial={emptyCampaign} />;
  if (
    ![
      "dashboard",
      "campaigns",
      "submissions",
      "analytics",
      "settings",
    ].includes(path[0]) ||
    path.length > 3
  )
    notFound();
  let campaignQuery = db
    .from("campaigns")
    .select("*,frames:campaign_frames(*)")
    .order("created_at", { ascending: false });
  if (account.role === "creator")
    campaignQuery = campaignQuery.eq("created_by", account.user.id);
  const { data: campaignData, error } = await campaignQuery;
  if (error)
    throw new Error("Unable to load campaigns. Check the database migration.");
  const campaigns = campaignData as Campaign[];
  const campaign =
    path[0] === "campaigns" && path[1]
      ? campaigns.find((c) => c.id === path[1])
      : undefined;
  if (path[1] && !campaign) notFound();
  if (path[2] === "edit" && campaign)
    return <CampaignForm initial={campaign} />;
  if (path[2] && path[2] !== "analytics") notFound();
  async function all<T>(table: string, order: string) {
    const rows: T[] = [];
    for (let from = 0; ; from += 1000) {
      let query = db!
        .from(table)
        .select("*")
        .order(order, { ascending: false })
        .range(from, from + 999);
      if (campaign) query = query.eq("campaign_id", campaign.id);
      const { data, error } = await query;
      if (error) throw new Error("Unable to load campaign activity.");
      rows.push(...(data as T[]));
      if (data.length < 1000) break;
    }
    return rows;
  }
  const [participants, events] = await Promise.all([
    all<Participant>("participants", "registered_at"),
    all<Event>("campaign_events", "created_at"),
  ]);
  return (
    <AdminViews
      view={
        campaign
          ? path[2] === "analytics"
            ? "analytics"
            : "overview"
          : path[0]
      }
      campaigns={campaign ? [campaign] : campaigns}
      participants={participants}
      events={events}
      campaign={campaign}
    />
  );
}
