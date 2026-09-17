import { notFound } from "next/navigation";
import { BookOpen, CalendarDays, GraduationCap, HeartHandshake, Images, MapPin, PawPrint, Users } from "lucide-react";
import Link from "next/link";
import { getCampaign, getCampaignUsage } from "@/lib/data";
import { configured, adminClient } from "@/lib/supabase/server";
import { isOpen } from "@/lib/demo";
import CampaignApp from "@/components/CampaignApp";
import { Logo } from "@/components/Brand";
import CampaignShareLink from "@/components/CampaignShareLink";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const c = await getCampaign((await params).slug);
  return {
    title: c ? `${c.name} | Framezi` : "Campaign unavailable | Framezi",
    description: c?.description,
    openGraph: c?.cover_url ? { images: [c.cover_url], title: c.name, description: c.description } : undefined,
    twitter: c?.cover_url ? { card: "summary_large_image", images: [c.cover_url], title: c.name, description: c.share_text } : undefined,
  };
}

export default async function CampaignPage({ params, searchParams }: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ preview?: string }>;
}) {
  const c = await getCampaign((await params).slug);
  if (!c) notFound();
  const preview = (await searchParams).preview === "1" && Boolean(await adminClient());
  const frameCount = c.frames.filter((frame) => frame.is_active).length;
  const usageCount = await getCampaignUsage(c.id);
  const shortPath = c.short_code ? `/c/${c.short_code}` : `/${c.slug}`;
  const CampaignIcon = c.slug === "world-animal-day-2026"
    ? PawPrint
    : c.slug === "world-teachers-day-2026"
      ? BookOpen
      : c.slug === "world-mental-health-day-2026"
        ? HeartHandshake
        : GraduationCap;
  return (
    <div className="campaign-page simple-campaign" style={{ "--campaign": c.primary_color, "--blue": c.primary_color } as React.CSSProperties}>
      <header className="simple-campaign-header">
        <Logo />
        <span className="campaign-free-badge">Free · No watermark</span>
      </header>
      <main>
        <section className="simple-campaign-title">
          <h1>{c.title}</h1>
          <div className="campaign-owner"><span className="campaign-app-icon"><CampaignIcon size={16} /></span><strong>{c.organization_name}</strong></div>
          {(c.event_date_text || c.location) && <div className="event-meta">
            <span><Images size={14} />{frameCount} {frameCount === 1 ? "frame" : "frames"} available</span>
            <span><Users size={14} />{usageCount.toLocaleString()} {usageCount === 1 ? "person" : "people"} joined</span>
          </div>}
        </section>
        {isOpen(c) || preview ? <CampaignApp campaign={c} demo={!configured() || preview} /> : (
          <div className="generator"><div className="panel empty">
            <h2>{c.start_at && Date.parse(c.start_at) > Date.now() ? "Campaign not started" : "Campaign ended"}</h2>
            <p>Please check with the campaign organizer.</p>
          </div></div>
        )}
        <section className="campaign-about">
          <span className="campaign-section-label">ABOUT THIS CAMPAIGN</span>
          <h2>{c.name}</h2>
          <p>{c.description}</p>
          <div className="campaign-about-meta">
            {c.event_date_text && <span><CalendarDays size={15} />{c.event_date_text}</span>}
            {c.location && <span><MapPin size={15} />{c.location}</span>}
          </div>
          <CampaignShareLink path={shortPath} title={c.title} caption={c.share_text} />
        </section>
      </main>
      <footer className="simple-campaign-foot">
        <Logo />
        <p>Visual campaigns made simple. Your photo stays on your device.</p>
        <div><Link href="/">Campaigns</Link><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link></div>
        <small>© 2026 <a href="https://infonits.io" target="_blank" rel="noreferrer">Infonits</a>. All rights reserved.</small>
      </footer>
    </div>
  );
}
